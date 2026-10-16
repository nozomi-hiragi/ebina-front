import { createEffect, on, onCleanup } from "solid-js";
import { wakeAutofillClient, wakeErrorCode } from "./wake";

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function supportsAutofill(): Promise<boolean> {
  const pkc = globalThis.PublicKeyCredential as unknown as {
    isConditionalMediationAvailable?: () => Promise<boolean>;
  };
  if (typeof pkc?.isConditionalMediationAvailable !== "function") {
    return false;
  }
  try {
    return await pkc.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

type Options = {
  server: () => string;
  // 値が変わるとオートフィルを張り直すカウンター
  retry: () => number;
  // 資格情報が選ばれてログインが成功したとき
  onSuccess: (server: string) => Promise<void>;
  // 資格情報が選択された後のサーバー側失敗など
  onError?: (err: unknown) => void;
};

// パスキーのオートフィルを背景で待つ。通信失敗・タイムアウトなどは静かに処理する
export function createPasskeyAutofill(options: Options): { abort: () => Promise<void> } {
  let activeController: AbortController | undefined;
  let disposed = false;
  let activeRun: Promise<void> | undefined;
  let cancelScheduled: (() => void) | undefined;

  const abort = async () => {
    cancelScheduled?.();
    if (activeController) {
      activeController.abort();
      activeController = undefined;
    }
    await activeRun;
  };

  onCleanup(() => {
    disposed = true;
    abort();
  });

  const runLoop = async (s: string, isStale: () => boolean, controller: AbortController) => {
    const supported = await supportsAutofill();
    if (!supported || disposed || isStale() || controller.signal.aborted) return;

    while (!disposed && !isStale() && !controller.signal.aborted) {
      let selected = false;

      try {
        const client = wakeAutofillClient(s, controller.signal, () => { selected = true; });
        await client.login({ mode: "discoverable" });

        if (disposed || isStale() || controller.signal.aborted) return;
        await options.onSuccess(s);
        return;
      } catch (err) {
        if (disposed || isStale() || controller.signal.aborted) return;

        const isTimeout =
          (err instanceof DOMException && err.name === "TimeoutError") ||
          wakeErrorCode(err) === "timeout";

        if (isTimeout) {
          // タイムアウトで中断された場合は静かに張り直す
          continue;
        }

        const isAbort =
          (err instanceof DOMException && (err.name === "AbortError" || err.name === "NotAllowedError")) ||
          wakeErrorCode(err) === "cancelled";

        if (isAbort) {
          return;
        }

        // 資格情報が選択された後のサーバー側失敗などは画面に表示可能
        if (selected && options.onError) {
          options.onError(err);
        }
        return;
      }
    }
  };

  createEffect(
    on([options.server, options.retry], ([s]) => {
      void abort();
      if (!s || !isHttpUrl(s)) return;
      let stale = false;
      const controller = new AbortController();
      activeController = controller;
      // 入力中の URL ごとに通信しないよう、少し待ってから始める
      const timer = setTimeout(() => {
        activeRun = runLoop(s, () => stale, controller);
      }, 500);

      cancelScheduled = () => {
        stale = true;
        clearTimeout(timer);
        controller.abort();
      };
      onCleanup(() => {
        stale = true;
        clearTimeout(timer);
        controller.abort();
      });
    }),
  );

  return { abort };
}
