import type { Binette, BinetteAsset } from "./types";

export class BinetteError extends Error {
  constructor(public readonly code: "unsupported_version" | "invalid_format", message: string) {
    super(message);
    this.name = "BinetteError";
  }
}

function invalid(message: string): never {
  throw new BinetteError("invalid_format", message);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseBinette(value: unknown): Binette {
  if (!record(value)) invalid("Binette はオブジェクトで指定してください。");
  if (typeof value.binette !== "string" || !/^\d+\.\d+$/.test(value.binette)) {
    invalid("Binette のバージョンが正しくありません。");
  }
  if (value.binette.split(".")[0] !== "0") {
    throw new BinetteError("unsupported_version", "この Binette のバージョンには対応していません。");
  }
  if (value.title !== undefined && typeof value.title !== "string") invalid("title は文字列で指定してください。");
  const assets: Record<string, BinetteAsset> = Object.create(null);
  if (value.assets !== undefined) {
    if (!record(value.assets)) invalid("assets はオブジェクトで指定してください。");
    for (const [name, asset] of Object.entries(value.assets)) {
      if (!name || /[./\\]/.test(name)) invalid("asset の名前には拡張子やパスを指定できません。");
      if (!record(asset) || typeof asset.type !== "string" || !asset.type) invalid("asset の type が正しくありません。");
      const hasContent = Object.hasOwn(asset, "content");
      const hasSrc = Object.hasOwn(asset, "src");
      if (hasContent === hasSrc) invalid("asset には content と src のどちらか一方を指定してください。");
      if (hasContent) {
        if (typeof asset.content !== "string") invalid("asset の content は文字列で指定してください。");
        assets[name] = { type: asset.type, content: asset.content };
      } else {
        if (typeof asset.src !== "string" || !asset.src) invalid("asset の src は URL で指定してください。");
        assets[name] = { type: asset.type, src: asset.src };
      }
    }
  }
  const common = { binette: value.binette, title: value.title as string | undefined, assets };
  const hasContent = Object.hasOwn(value, "content");
  const hasEntry = Object.hasOwn(value, "entry");
  if (value.type === undefined && !hasContent && !hasEntry) return common;
  if (value.type !== "html" && value.type !== "js") invalid("type は html または js で指定してください。");
  if (hasContent === hasEntry) invalid("content と entry のどちらか一方を指定してください。");
  if (hasContent) {
    if (typeof value.content !== "string") invalid("content は文字列で指定してください。");
    return { ...common, type: value.type, content: value.content };
  }
  if (typeof value.entry !== "string" || !Object.hasOwn(assets, value.entry)) invalid("entry の asset がありません。");
  if (assets[value.entry].type !== value.type) invalid("entry と Binette の type が一致しません。");
  return { ...common, type: value.type, entry: value.entry };
}
