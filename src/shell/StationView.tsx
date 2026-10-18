import { createEffect, createSignal, onCleanup, untrack } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { createScene, type BinetteScene } from "@binette/scene";
import { clearSession, session } from "../auth/session";
import { isReauthError, wakeClient } from "../auth/wake";
import { setTheme, theme } from "./theme";
import { version } from "../../package.json";

export default function StationView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = createSignal<BinetteScene>();
  let container!: HTMLDivElement;
  const path = () => location.pathname.replace(/^\/ebina-station(?=\/|$)/, "") || "/";
  const shellNavigate = (target: string) => {
    const base = "/ebina-station";
    navigate(target === base ? "/" : target.startsWith(`${base}/`) ? target.slice(base.length) : target);
  };

  createEffect(() => {
    const active = session();
    if (!active) return;
    let disposed = false;
    let initializing = true;
    const initialPath = untrack(path);
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
    const scene = createScene({
      container,
      fetch: frontFetch,
      binette: path => path === "/" ? "/index.bina" : `${path}.bina`,
      entry: "/settings.bina",
      navigate: target => {
        if (disposed) return;
        // 直接開いたパスは、入口を読み込んだあとも維持する。
        // 入口の取得中に別のパスへ移っていたら、始めたときの遷移はしない
        if (initializing && (initialPath !== "/" || untrack(path) !== "/")) return;
        shellNavigate(target);
      },
      sh: { user: { ...active.user } },
      settings: {
        theme: {
          options: [{ value: "ebina-light", label: "ライト" }, { value: "ebina-dark", label: "ダーク" }],
          get: theme,
          set: value => { if (value === "ebina-light" || value === "ebina-dark") setTheme(value); },
        },
        connection: { server: active.server, user: { ...active.user } },
        versions: { Binette: "0.1", "ebina-front": version },
        logout: async () => {
          try { await wakeClient(active.server).logout(); }
          catch { /* サーバー側の失敗時もローカルのセッションを消す */ }
          goToLogin();
        },
      },
    });
    setReady(undefined);
    onCleanup(() => {
      disposed = true;
      scene.dispose();
    });
    void scene.start().then(() => {
      initializing = false;
      if (!disposed) setReady(scene);
    });
  });

  createEffect(() => {
    const scene = ready();
    const current = path();
    if (scene) void scene.show(current);
  });
  return <div ref={container} />;
}
