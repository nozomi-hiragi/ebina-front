import { createEffect, on, onCleanup } from "solid-js";
import {
  WebAuthnAbortService,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/browser";
import { getLoginOptions } from "./api";

function isHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type Options = {
  server: () => string;
  // 値が変わるとオートフィルを張り直すカウンター
  retry: () => number;
  // 資格情報が選ばれたとき。エラー処理は呼び出し側で行う
  onCredential: (server: string, sessionId: string, response: AuthenticationResponseJSON) => Promise<void>;
};

// パスキーのオートフィルを背景で待つ。通信失敗・中断などのエラーは静かに無視する
export function createPasskeyAutofill(options: Options) {
  let disposed = false;
  onCleanup(() => {
    disposed = true;
  });

  // isStale() が true なら、設定が変わったので何もしない
  const start = async (s: string, isStale: () => boolean) => {
    try {
      if (!(await browserSupportsWebAuthnAutofill()) || disposed || isStale()) return;
      const { sessionId, options: optionsJSON } = await getLoginOptions(s);
      if (disposed || isStale()) return;
      const response = await startAuthentication({ optionsJSON, useBrowserAutofill: true });
      // ボタン操作で中断されたり画面を離れた後は何もしない
      if (disposed || isStale()) return;
      await options.onCredential(s, sessionId, response);
    } catch {
      // サーバー未接続・AbortError・NotAllowedError などは静かに無視する
    }
  };

  createEffect(
    on([options.server, options.retry], ([s]) => {
      if (!s || !isHttpUrl(s)) return;
      let stale = false;
      // 入力中の URL ごとに通信しないよう、少し待ってから始める
      const timer = setTimeout(() => void start(s, () => stale), 500);
      onCleanup(() => {
        stale = true;
        clearTimeout(timer);
        WebAuthnAbortService.cancelCeremony();
      });
    }),
  );
}
