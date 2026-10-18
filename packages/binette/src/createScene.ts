import { parseBinette } from "./parse";
import { play, type BinettePlayback } from "./playback";
import { createResolver } from "./resolve";
import { baseView, button, element, renderSettings, type SceneSettings } from "./settings";
import type { Binette } from "./types";

export interface SceneOptions {
  container: HTMLElement;
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  binette: (path: string) => string;
  entry: string;
  navigate: (path: string) => void;
  sh: object;
  settings: SceneSettings;
  onError?: (error: unknown) => void;
}
export interface BinetteScene {
  start(): Promise<void>;
  show(path: string): Promise<void>;
  dispose(): void;
}

export function createScene(options: SceneOptions): BinetteScene {
  const root = options.container.shadowRoot ?? options.container.attachShadow({ mode: "open" });
  let entry: Extract<Binette, { type: "settings" }> | undefined;
  let disposed = false;
  let generation = 0;
  let playback: BinettePlayback | undefined;
  let controller: AbortController | undefined;
  let starting: Promise<void> | undefined;
  let startupFailed = false;
  let lastPath = "/";
  const report = (error: unknown) => options.onError?.(error);
  const clear = () => {
    generation++;
    controller?.abort();
    controller = undefined;
    playback?.dispose();
    playback = undefined;
    root.replaceChildren();
  };
  const errorView = (retry: () => void) => {
    const main = baseView(root, "読み込めませんでした");
    main.setAttribute("role", "alert");
    main.append(button("再試行", retry));
  };
  const fetchBinette = async (url: string) => {
    const response = await options.fetch(url);
    if (response.status === 404) return undefined;
    if (!response.ok) throw response;
    return parseBinette(await response.json());
  };
  const scene: BinetteScene = {
    start() {
      if (disposed) return Promise.resolve();
      if (starting) return starting;
      startupFailed = false;
      const current = generation;
      starting = (async () => {
        try {
          const value = await fetchBinette(options.entry);
          if (disposed) return;
          entry = value?.type === "settings" ? value : undefined;
          const route = entry?.routes?.["/"];
          options.navigate(route ? route.redirect ?? "/" : "/settings");
        } catch (error) {
          startupFailed = true;
          report(error);
          if (!disposed && current === generation) errorView(() => {
            starting = undefined;
            void scene.start().then(() => { if (!startupFailed) void scene.show(lastPath); });
          });
        }
      })();
      return starting;
    },
    async show(path) {
      lastPath = path;
      // 入口の取得中（再試行を含む）は、取り終わるまで待つ
      if (starting) await starting;
      if (disposed || startupFailed || path !== lastPath) return;
      clear();
      const current = generation;
      const valid = () => !disposed && current === generation;
      // 離れた画面の非同期処理から遷移させない
      const navigate = (target: string) => { if (valid()) options.navigate(target); };
      if (path === "/settings") {
        renderSettings(root, options.settings, entry?.settings ?? [], options.navigate, report);
        return;
      }
      const route = entry?.routes?.[path];
      if (route?.redirect !== undefined) { options.navigate(route.redirect); return; }
      const abort = new AbortController();
      controller = abort;
      try {
        const value = await fetchBinette(route?.binette ?? options.binette(path));
        if (!valid()) return;
        if (!value || !value.type) {
          const main = baseView(root, value?.title ?? (value ? "ホーム" : "見つかりません"));
          main.append(button("設定", () => options.navigate("/settings")));
        } else if (value.type === "settings") {
          baseView(root, value.title ?? "設定").append(element("p", "この画面はまだ表示できません"));
        } else {
          document.title = value.title ?? "ホーム";
          const handle = await play(options.container, value, {
            signal: abort.signal,
            resolver: createResolver({ fetch: options.fetch }),
            onNavigate: navigate,
            sh: { ...options.sh, version: "0.1", navigate, fetch: options.fetch },
          });
          if (!valid()) handle.dispose();
          else playback = handle;
        }
      } catch (error) {
        report(error);
        if (valid()) errorView(() => { void scene.show(path); });
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
    },
  };
  return scene;
}
