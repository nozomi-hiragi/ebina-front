import type { AssetResolver } from "./resolve";
import type { Binette } from "@binette/core";

export interface PlaybackOptions {
  sh: object;
  resolver: AssetResolver;
  onNavigate?: (path: string) => void;
  signal?: AbortSignal;
}

export interface BinettePlayback { dispose(): void }

const active = new WeakMap<HTMLElement, BinettePlayback>();

export async function play(container: HTMLElement, binette: Binette, options: PlaybackOptions): Promise<BinettePlayback> {
  active.get(container)?.dispose();
  const root = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  root.replaceChildren();
  let disposed = false;
  let cleanup: (() => void) | undefined;
  const urls = new Set<string>();
  const navigate = (event: Event) => {
    if (!options.onNavigate || !(event instanceof MouseEvent) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.composedPath().find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement);
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const href = link.getAttribute("href");
    if (!href || /^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//")) return;
    const url = new URL(href, document.baseURI);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    options.onNavigate(url.pathname + url.search + url.hash);
  };
  const playback: BinettePlayback = {
    dispose() {
      if (disposed) return;
      disposed = true;
      root.removeEventListener("click", navigate);
      options.signal?.removeEventListener("abort", abort);
      try { cleanup?.(); } finally {
        for (const url of urls) URL.revokeObjectURL(url);
        urls.clear();
        if (active.get(container) === playback) {
          active.delete(container);
          root.replaceChildren();
        }
      }
    },
  };
  const abort = () => playback.dispose();
  active.set(container, playback);
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) {
    playback.dispose();
    return playback;
  }
  root.addEventListener("click", navigate);
  const asset = async (name: string) => {
    const value = binette.assets && Object.hasOwn(binette.assets, name) ? binette.assets[name] : undefined;
    if (!value) throw new Error(`asset が見つかりません: ${name}`);
    const response = await options.resolver(value);
    return response;
  };
  const assetText = async (name: string) => {
    const response = await asset(name);
    if (!response.ok) throw Object.assign(new Error(`asset を読み込めませんでした: ${name} (${response.status})`), { status: response.status, response });
    return response.text();
  };
  try {
    const styles = await Promise.all(Object.entries(binette.assets ?? {}).filter(([, value]) => value.type === "css").map(([name]) => assetText(name)));
    if (disposed) return playback;
    const content = binette.content ?? (binette.entry ? await assetText(binette.entry) : undefined);
    if (disposed) return playback;
    const host = document.createElement("div");
    for (const css of styles) {
      const style = document.createElement("style");
      style.textContent = css;
      root.append(style);
    }
    root.append(host);
    if (binette.type === "html") host.innerHTML = content ?? "";
    if (binette.type === "js") {
      const url = URL.createObjectURL(new Blob([content ?? ""], { type: "text/javascript" }));
      urls.add(url);
      let module: { mount?: unknown };
      try { module = await import(/* @vite-ignore */ url); } finally {
        URL.revokeObjectURL(url);
        urls.delete(url);
      }
      if (disposed) return playback;
      if (typeof module.mount !== "function") throw new Error("Binette に mount 関数がありません。");
      const result: unknown = await module.mount(host, { ...options.sh, asset });
      if (typeof result === "function") {
        if (disposed) result();
        else cleanup = result as () => void;
      }
    }
    return playback;
  } catch (error) {
    playback.dispose();
    throw error;
  }
}
