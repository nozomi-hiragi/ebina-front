import { createEffect, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { useNavigate } from "@solidjs/router";
import { Scene } from "@binette/scene";
import { clearSession, session } from "../auth/session";
import { isReauthError, wakeClient } from "../auth/wake";

export default function StationView() {
  const navigate = useNavigate();
  let container!: HTMLDivElement;

  createEffect(() => {
    const active = session();
    if (!active) return;
    let disposed = false;
    const goToLogin = () => {
      if (disposed) return;
      clearSession();
      navigate("/login", { replace: true });
    };
    const frontFetch = async (url: string, init?: RequestInit): Promise<Response> => {
      // 外部の HTTP(S) はそのまま。401 などでも Station のセッションには触れない
      if (/^https?:\/\//i.test(url)) return fetch(url, init);
      if (!/^wake:\/\//i.test(url)) {
        if (/^[a-z][a-z\d+.-]*:/i.test(url)) throw new Error("対応していない URL です。");
        url = `wake://station${url.startsWith("/") ? "" : "/"}${url}`;
      }
      try {
        const client = wakeClient(active.server);
        if (!client.loggedIn) await client.reload();
        const body = init?.body == null ? undefined : new Uint8Array(await new Response(init.body).arrayBuffer());
        const response = await client.wakeFetch(url, {
          method: init?.method,
          headers: init?.headers ? Array.from(new Headers(init.headers).entries()) : undefined,
          body,
        });
        if (response.status === 401) { goToLogin(); throw response; }
        return response;
      } catch (error) {
        if (isReauthError(error)) goToLogin();
        throw error;
      }
    };
    const scene = new Scene({
      serverURL: "wake://station/",
      base: "/ebina-station/",
      fetch: frontFetch,
      // ビネットの settings の element セクションが component で指定する部品
      components: {
        logout: (element) => render(() => (
          <button type="button" onClick={async () => {
            try { await wakeClient(active.server).logout(); }
            catch { /* サーバー側で失敗してもローカルのセッションは消す */ }
            goToLogin();
          }}>ログアウト</button>
        ), element),
      },
    });
    container.append(scene.element);
    onCleanup(() => {
      disposed = true;
      scene.dispose();
      scene.element.remove();
    });
    void scene.start();
  });

  return <div ref={container} />;
}
