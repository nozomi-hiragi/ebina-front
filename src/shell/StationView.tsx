import { createEffect, createSignal, onCleanup, untrack } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { createPlayer, type BinettePlayer } from "../binette";
import { clearSession, session } from "../auth/session";
import { isReauthError, wakeClient } from "../auth/wake";
import { setTheme, theme } from "./theme";
import { version } from "../../package.json";

export default function StationView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = createSignal<BinettePlayer>();
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
      try {
        let response: Response;
        if (/^https?:\/\//i.test(url)) response = await fetch(url, init);
        else {
          if (!/^wake:\/\//i.test(url)) {
            if (/^[a-z][a-z\d+.-]*:/i.test(url)) throw new Error("対応していない URL です。");
            url = `wake://station${url.startsWith("/") ? "" : "/"}${url}`;
          }
          const client = wakeClient(active.server);
          if (!client.loggedIn) await client.reload();
          const body = init?.body == null ? undefined : new Uint8Array(await new Response(init.body).arrayBuffer());
          response = await client.wakeFetch(url, {
            method: init?.method,
            headers: init?.headers ? Array.from(new Headers(init.headers).entries()) : undefined,
            body,
          });
        }
        if (response.status === 401) { goToLogin(); throw response; }
        return response;
      } catch (error) {
        if (isReauthError(error)) goToLogin();
        throw error;
      }
    };
    const player = createPlayer({
      container,
      fetch: frontFetch,
      binette: path => path === "/" ? "/index.bina" : `${path}.bina`,
      entry: "/settings.bina",
      navigate: target => {
        if (disposed) return;
        // 直接開いたパスは、入口を読み込んだあとも維持する。
        if (initializing && initialPath !== "/") return;
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
      onError: error => { if (isReauthError(error)) goToLogin(); },
    });
    setReady(undefined);
    onCleanup(() => {
      disposed = true;
      player.dispose();
    });
    void player.start().then(() => {
      initializing = false;
      if (!disposed) setReady(player);
    });
  });

  createEffect(() => {
    const player = ready();
    const current = path();
    if (player) void player.show(current);
  });
  return <div ref={container} />;
}
