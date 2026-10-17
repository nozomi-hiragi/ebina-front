import type { BinetteAsset } from "./types";

export type AssetResolver = (asset: BinetteAsset) => Promise<Response>;

export interface ResolverOptions {
  fetchWake: (url: string) => Promise<Response>;
  baseUrl: string;
}

const contentTypes: Record<string, string> = {
  js: "text/javascript", css: "text/css", html: "text/html", svg: "image/svg+xml",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", json: "application/json",
};

export function createResolver(options: ResolverOptions): AssetResolver {
  return async (asset) => {
    if (asset.content !== undefined) {
      return new Response(asset.content, { headers: { "content-type": contentTypes[asset.type] ?? "text/plain" } });
    }
    if (/^wake:\/\//i.test(asset.src)) return options.fetchWake(asset.src);
    const url = new URL(asset.src, `${options.baseUrl.replace(/\/+$/, "")}/`);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("asset の URL に対応していません。");
    return fetch(url);
  };
}
