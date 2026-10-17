import { For, Match, Switch, createEffect, createSignal, onCleanup } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useLocation, useNavigate } from "@solidjs/router";
import { BinetteError, createResolver, parseBinette, play } from "../binette";
import { Button, LinkButton } from "../components/ui";
import { clearSession, session } from "../session";
import { setTheme, theme, type Theme } from "../theme";
import { isReauthError, wakeClient } from "../wake";
import { registerShellElements } from "./elements";
import { createShellApi } from "./sh";

type ViewState = "loading" | "playing" | "empty" | "settings" | "logout" | "missing" | "error";
const themes: { value: Theme; label: string }[] = [
  { value: "ebina-light", label: "ライト" },
  { value: "ebina-dark", label: "ダーク" },
];

function ShellHeader(props: { title: string }) {
  return <Dynamic component="sh-header" title={props.title} />;
}

function SettingsFallback() {
  return <div class="flex flex-col gap-6 p-4 sm:p-6">
    <section class="flex flex-col gap-3 rounded-box bg-base-200 p-6">
      <h2 class="font-bold">テーマ</h2>
      <div class="join" role="group" aria-label="テーマ"><For each={themes}>{option =>
        <button type="button" class="btn join-item" classList={{ "btn-primary": theme() === option.value }} aria-pressed={theme() === option.value} onClick={() => setTheme(option.value)}>{option.label}</button>
      }</For></div>
    </section>
    <section class="flex flex-col gap-2 rounded-box bg-base-200 p-6">
      <h2 class="font-bold">接続先</h2><p class="break-all">{session()?.server}</p>
      <h2 class="mt-2 font-bold">ユーザー</h2><p class="break-all">{session()?.user.name}</p><p class="break-all font-mono text-sm text-muted">{session()?.user.id}</p>
    </section>
    <div><LinkButton href="/logout">ログアウト</LinkButton></div>
  </div>;
}

function Logout() {
  const navigate = useNavigate();
  const [busy, setBusy] = createSignal(false);
  const logout = async () => {
    setBusy(true);
    const active = session();
    if (active) {
      try { await wakeClient(active.server).logout(); }
      catch { /* サーバー側の失敗時もローカルのセッションを消す */ }
    }
    clearSession();
    navigate("/login", { replace: true });
  };
  return <div class="p-4 sm:p-6"><Button disabled={busy()} onClick={logout}>{busy() ? "ログアウト中…" : "ログアウト"}</Button></div>;
}

export default function StationView() {
  registerShellElements();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = createSignal<ViewState>("loading");
  const [title, setTitle] = createSignal("ホーム");
  const [retry, setRetry] = createSignal(0);
  const [errorDetail, setErrorDetail] = createSignal("");
  let container!: HTMLDivElement;
  let wrapper!: HTMLDivElement;

  const shellNavigate = (path: string) => {
    const base = "/ebina-station";
    navigate(path === base ? "/" : path.startsWith(`${base}/`) ? path.slice(base.length) : path);
  };
  const onNavigate = (event: Event) => {
    const path = (event as CustomEvent<{ path?: unknown }>).detail?.path;
    if (typeof path === "string") shellNavigate(path);
  };
  createEffect(() => {
    wrapper.addEventListener("sh-navigate", onNavigate);
    onCleanup(() => wrapper.removeEventListener("sh-navigate", onNavigate));
  });

  createEffect(() => {
    const active = session();
    const path = location.pathname.replace(/^\/ebina-station(?=\/|$)/, "") || "/";
    retry();
    if (!active) return;
    let cancelled = false;
    const controller = new AbortController();
    let playback: { dispose(): void } | undefined;
    const target = document.createElement("div");
    container.replaceChildren(target);
    onCleanup(() => {
      cancelled = true;
      controller.abort();
      playback?.dispose();
      target.remove();
    });
    const defaultTitle = path === "/settings" ? "設定" : path === "/logout" ? "ログアウト" : "ホーム";
    setTitle(defaultTitle);
    document.title = defaultTitle;
    if (path === "/logout") { setState("logout"); return; }
    setState("loading");
    setErrorDetail("");
    const goToLogin = () => {
      if (cancelled) return;
      clearSession();
      navigate("/login", { replace: true });
    };
    const fetchWake = async (url: string) => {
      const client = wakeClient(active.server);
      // ページを開いた直後は、保存済みのセッションをまだ読み込んでいない
      if (!client.loggedIn) await client.reload();
      const response = await client.wakeFetch(url);
      if (response.status === 401) { goToLogin(); throw response; }
      return response;
    };
    const load = async () => {
      try {
        const home = path === "/" || path === "/home";
        const response = await fetchWake(`wake://station${home ? "/home" : path}.bina`);
        if (cancelled) return;
        if (response.status === 404) {
          setState(home ? "empty" : path === "/settings" ? "settings" : "missing");
          return;
        }
        if (!response.ok) throw response;
        const binette = parseBinette(await response.json());
        if (cancelled) return;
        const nextTitle = binette.title || "ホーム";
        setTitle(nextTitle);
        document.title = nextTitle;
        if (!binette.type) { setState("empty"); return; }
        const sh = createShellApi(active, path => { if (!cancelled) shellNavigate(path); });
        const handle = await play(target, binette, {
          sh,
          signal: controller.signal,
          resolver: createResolver({ fetchWake, baseUrl: active.server }),
          onNavigate: path => { if (!cancelled) shellNavigate(path); },
        });
        if (cancelled) { handle.dispose(); return; }
        playback = handle;
        setState("playing");
      } catch (error) {
        if (cancelled) return;
        if (isReauthError(error)) goToLogin();
        else {
          if (error instanceof BinetteError) setErrorDetail(error.message);
          setState("error");
        }
      }
    };
    void load();
  });

  return <div ref={wrapper}>
    <div ref={container} />
    <Switch>
      <Match when={state() === "loading"}><ShellHeader title={title()} /><p class="p-4 text-muted" role="status">読み込み中…</p></Match>
      <Match when={state() === "empty"}><ShellHeader title={title()} /></Match>
      <Match when={state() === "settings"}><ShellHeader title="設定" /><SettingsFallback /></Match>
      <Match when={state() === "logout"}><ShellHeader title="ログアウト" /><Logout /></Match>
      <Match when={state() === "missing"}><ShellHeader title={title()} /><p class="p-4">見つかりません</p></Match>
      <Match when={state() === "error"}><ShellHeader title={title()} /><div class="flex flex-col items-start gap-4 p-4"><p role="alert">読み込めませんでした{errorDetail() ? `：${errorDetail()}` : ""}</p><Button onClick={() => setRetry(n => n + 1)}>再試行</Button></div></Match>
    </Switch>
  </div>;
}
