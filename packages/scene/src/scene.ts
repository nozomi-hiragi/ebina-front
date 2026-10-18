import { parseBinette } from "@binette/core";
import { joueur as createJoueur, type BinetteJoueur } from "./joueur";
import { createResolver } from "./resolve";
import { SettingsPage, type SettingsSection } from "./settings";
import { button, element, renderView } from "./view";
import type { Binette } from "@binette/core";

export interface SceneOptions {
  element: HTMLElement;
  serverURL: string;
  fetch?: (url: string, init?: RequestInit) => Promise<Response>;
  base?: string;
  onError?: (error: unknown) => void;
}
export class Scene {
  #options: SceneOptions;
  #root: ShadowRoot;
  #entry: Binette | undefined;
  #disposed = false;
  #generation = 0;
  #joueur: BinetteJoueur | undefined;
  #controller: AbortController | undefined;
  #starting: Promise<void> | undefined;
  #startupFailed = false;
  #started = false;
  #fetch: NonNullable<SceneOptions["fetch"]>;
  #base: string;
  #listening = false;
  #settings: HTMLElement | undefined;

  constructor(options: SceneOptions) {
    this.#options = options;
    this.#root = options.element.shadowRoot ?? options.element.attachShadow({ mode: "open" });
    const fetchResource = options.fetch ?? ((url, init) => globalThis.fetch(url, init));
    this.#fetch = (url, init) => fetchResource(new URL(url, options.serverURL).href, init);
    this.#base = `/${(options.base ?? "/").split("/").filter(Boolean).join("/")}`;
  }

  #report = (error: unknown) => this.#options.onError?.(error);
  #basicMain = (title: string) => {
    const main = element("main");
    main.append(element("h1", title));
    return main;
  };
  #clear = () => {
    this.#generation++;
    this.#controller?.abort();
    this.#controller = undefined;
    this.#joueur?.dispose();
    this.#joueur = undefined;
    this.#settings = undefined;
    this.#root.replaceChildren();
  };
  #errorView = (retry: () => void) => {
    const main = renderView(this.#root, "読み込めませんでした", this.#basicMain("読み込めませんでした"));
    main.setAttribute("role", "alert");
    main.append(button("再試行", retry));
  };
  #notFound = () => {
    const main = renderView(this.#root, "見つかりません", this.#basicMain("見つかりません"));
    main.append(button("設定", () => this.#navigate("/settings")));
  };
  #fetchBinette = async (url: string) => {
    const response = await this.#fetch(url);
    if (response.status === 404) return undefined;
    if (!response.ok) throw response;
    return parseBinette(await response.json());
  };
  #path = (url: URL): string | undefined => {
    if (url.origin !== location.origin) return undefined;
    if (this.#base === "/") return url.pathname;
    if (url.pathname === this.#base) return "/";
    return url.pathname.startsWith(`${this.#base}/`) ? url.pathname.slice(this.#base.length) : undefined;
  };
  #url = (path: string): URL => {
    const target = new URL(path, "https://scene.invalid/");
    if (target.origin !== "https://scene.invalid") throw new Error("Scene 内のパスを指定してください。");
    return new URL(`${this.#base === "/" ? "" : this.#base}${target.pathname}${target.search}${target.hash}`, location.origin);
  };
  #popstate = () => { void this.#showCurrent(); };
  #navigate = async (path: string, replace = false): Promise<void> => {
    if (this.#disposed) return;
    const url = this.#url(path);
    history[replace ? "replaceState" : "pushState"](history.state, "", url);
    if (this.#starting) await this.#starting;
    else await this.#showCurrent();
  };
  start = (): Promise<void> => {
    if (this.#disposed) return Promise.resolve();
    if (this.#starting) return this.#starting;
    if (this.#started) return Promise.resolve();
    if (!this.#listening) {
      window.addEventListener("popstate", this.#popstate);
      this.#listening = true;
    }
    this.#startupFailed = false;
    const initialURL = location.href;
    this.#starting = (async () => {
      try {
        const value = await this.#fetchBinette("/index.bina");
        if (this.#disposed) return;
        this.#started = true;
        this.#entry = value;
        if (location.href === initialURL && this.#path(new URL(location.href)) === "/") {
          const url = this.#url(value?.type === "redirect" ? value.content : this.#entry?.routes?.["/"] ? "/" : "/settings");
          if (!url.search) url.search = location.search;
          if (!url.hash) url.hash = location.hash;
          history.replaceState(history.state, "", url);
        }
      } catch (error) {
        if (this.#disposed) return;
        this.#startupFailed = true;
        this.#report(error);
        this.#errorView(() => {
          this.#starting = undefined;
          void this.start();
        });
      }
    })().then(async () => {
      this.#starting = undefined;
      if (!this.#startupFailed) await this.#showCurrent();
    });
    return this.#starting;
  };
  show = async (path: string): Promise<void> => {
    await this.#navigate(path);
  };
  #showCurrent = async (): Promise<void> => {
    if (this.#starting) return;
    if (this.#disposed || this.#startupFailed) return;
    let url = new URL(location.href);
    let path = this.#path(url);
    if (path === undefined) { this.#clear(); return; }
    if ((path === "/settings" || path.startsWith("/settings/")) && this.#settings) {
      this.#settings.dispatchEvent(new Event("scene-location-change"));
      return;
    }
    this.#clear();
    const current = this.#generation;
    const valid = () => !this.#disposed && current === this.#generation;
    const visited = new Set<string>();
    const redirect = (target: string) => {
      const next = this.#url(target);
      if (!next.search) next.search = url.search;
      if (!next.hash) next.hash = url.hash;
      url = next;
      path = this.#path(url)!;
      history.replaceState(history.state, "", url);
    };
    // 離れた画面の非同期処理から遷移させない
    const navigate = (target: string) => { if (valid()) this.#navigate(target); };
    const abort = new AbortController();
    this.#controller = abort;
    try {
      while (valid()) {
        if (visited.has(path!)) throw new Error("ルートの転送が循環しています。");
        visited.add(path!);
        if (path === "/settings" || path!.startsWith("/settings/")) {
          const sectionGeneral: SettingsSection = {
            type: "list",
            contents: [
              {
                id: "general",
                start: "⚙️",
                label: "General",
                sections: [
                  {
                    type: "list", contents: [
                      { id: "version", start: "", label: "Version", end: element("span", "0.1") },
                    ]
                  },
                ],
              },
            ],
          };
          const sections: SettingsSection[] = [
            sectionGeneral,
          ];
          this.#settings = SettingsPage({
            title: "Settings", sections,
            basePath: this.#url("/settings").pathname,
            navigate,
          });
          renderView(this.#root, "設定", this.#settings);
          this.#settings.dispatchEvent(new Event("scene-location-change"));
          return;
        }
        if (path === "/" && this.#entry?.type === "redirect") {
          redirect(this.#entry.content);
          continue;
        }
        const route = this.#entry?.routes?.[path!];
        if (route?.redirect !== undefined) {
          redirect(route.redirect);
          continue;
        }
        const binettePath = path === "/" ? "/index.bina" : `${path}.bina`;
        const value = await this.#fetchBinette(binettePath);
        if (!valid()) return;
        if (!value || !value.type) {
          if (!value) this.#notFound();
          else {
            const title = value.title ?? "ホーム";
            const main = renderView(this.#root, title, this.#basicMain(title));
            main.append(button("設定", () => navigate("/settings")));
          }
        } else if (value.type === "redirect") {
          redirect(value.content);
          continue;
        } else {
          document.title = value.title ?? "ホーム";
          const handle = await createJoueur(this.#options.element, value, {
            signal: abort.signal,
            resolver: createResolver({ fetch: this.#fetch }),
            onNavigate: target => {
              if (!valid()) return;
              const targetURL = new URL(target, location.href);
              const targetPath = this.#path(targetURL);
              if (targetPath !== undefined) this.#navigate(`${targetPath}${targetURL.search}${targetURL.hash}`);
            },
            base: this.#base,
            sh: { version: "0.1", navigate, fetch: this.#fetch },
          });
          if (!valid()) handle.dispose();
          else this.#joueur = handle;
        }
        return;
      }
    } catch (error) {
      if (valid()) this.#report(error);
      if (valid()) this.#errorView(() => { void this.#showCurrent(); });
    }
  };
  dispose = (): void => {
    if (this.#disposed) return;
    this.#disposed = true;
    window.removeEventListener("popstate", this.#popstate);
    this.#clear();
  };
}
