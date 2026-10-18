import * as v from "valibot";

const objectValue = (message: string) => v.custom<Record<string, unknown>>(
  (value) => typeof value === "object" && value !== null && !Array.isArray(value), message,
);
const nonempty = (message: string) => v.pipe(v.string(message), v.nonEmpty(message));
const absent = v.optional(v.never());

const versionString = v.pipe(v.string("Binette のバージョンが正しくありません。"), v.regex(/^\d+\.\d+$/, "Binette のバージョンが正しくありません。"));

export const binetteVersionSchema = v.pipe(
  objectValue("Binette はオブジェクトで指定してください。"),
  v.object({ binette: versionString }),
);

export const binetteAssetSchema = v.pipe(
  objectValue("asset の type が正しくありません。"),
  v.check((asset) => Object.hasOwn(asset, "content") !== Object.hasOwn(asset, "src"), "asset には content と src のどちらか一方を指定してください。"),
  v.transform((asset) => ({ type: asset.type, ...(Object.hasOwn(asset, "content") ? { content: asset.content } : { src: asset.src }) })),
  v.lazy((asset) => Object.hasOwn(asset as object, "content")
    ? v.object({ type: nonempty("asset の type が正しくありません。"), content: v.string("asset の content は文字列で指定してください。"), src: absent })
    : v.object({ type: nonempty("asset の type が正しくありません。"), src: nonempty("asset の src は URL で指定してください。"), content: absent })),
);

// record は特殊な名前を除外するため、全ての own enumerable key を検証してから辞書へ戻す。
const assetsSchema = v.pipe(
  objectValue("assets はオブジェクトで指定してください。"),
  v.transform(Object.entries),
  v.array(v.tuple([
    v.pipe(v.string(), v.nonEmpty("asset の名前には拡張子やパスを指定できません。"), v.check((name) => !/[./\\]/.test(name), "asset の名前には拡張子やパスを指定できません。")),
    binetteAssetSchema,
  ])),
  v.transform((entries) => Object.assign(Object.create(null) as Record<string, v.InferOutput<typeof binetteAssetSchema>>, Object.fromEntries(entries))),
);
const routeSchema = v.pipe(
  objectValue("route はオブジェクトで指定してください。"),
  v.object({ redirect: v.string() }),
);
const routesSchema = v.pipe(
  objectValue("routes はオブジェクトで指定してください。"),
  v.transform(Object.entries),
  v.array(v.tuple([v.pipe(v.string(), v.startsWith("/")), routeSchema])),
  v.transform(entries => Object.assign(Object.create(null), Object.fromEntries(entries)) as Record<string, v.InferOutput<typeof routeSchema>>),
);
const common = {
  binette: versionString,
  app: v.optional(v.string("app は文字列で指定してください。")),
  title: v.optional(v.string("title は文字列で指定してください。")),
  routes: v.optional(routesSchema),
  settings: v.optional(v.array(v.object({ app: v.string(), title: v.string(), path: v.string() }))),
  assets: v.optional(assetsSchema, () => Object.create(null) as v.InferOutput<typeof assetsSchema>),
};
const type = v.picklist(["html", "js"], "type は html、js、redirect のいずれかで指定してください。");

const binetteBodySchema = v.pipe(
  objectValue("Binette はオブジェクトで指定してください。"),
  v.check((value) => value.type === "html" || value.type === "js" || value.type === "redirect" || value.type === undefined && !Object.hasOwn(value, "content") && !Object.hasOwn(value, "entry"), "type は html、js、redirect のいずれかで指定してください。"),
  v.check((value) => value.type === undefined && !Object.hasOwn(value, "content") && !Object.hasOwn(value, "entry") || Object.hasOwn(value, "content") !== Object.hasOwn(value, "entry"), "content と entry のどちらか一方を指定してください。"),
  v.transform((value) => ({
    binette: value.binette, app: value.app, title: value.title, assets: value.assets, type: value.type, routes: value.routes, settings: value.settings,
    ...(Object.hasOwn(value, "content") ? { content: value.content } : {}),
    ...(Object.hasOwn(value, "entry") ? { entry: value.entry } : {}),
  })),
  v.lazy((value) => (value as Record<string, unknown>).type === undefined
    ? v.object({ ...common, type: absent, content: absent, entry: absent })
    : (value as Record<string, unknown>).type === "redirect"
      ? v.object({ ...common, type: v.literal("redirect"), content: v.pipe(nonempty("redirect の content は Scene 内のパスで指定してください。"), v.check(path => path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") && !/[\u0000-\u0020]/.test(path), "redirect の content は Scene 内のパスで指定してください。")), entry: absent })
    : Object.hasOwn(value as object, "content")
      ? v.object({ ...common, type, content: v.string("content は文字列で指定してください。"), entry: absent })
      : v.object({ ...common, type, entry: v.string("entry の asset がありません。"), content: absent })),
);

export const binetteSchema = v.pipe(
  binetteBodySchema,
  v.check((value) => value.entry === undefined || Object.hasOwn(value.assets, value.entry), "entry の asset がありません。"),
  v.check((value) => value.entry === undefined || !Object.hasOwn(value.assets, value.entry) || value.assets[value.entry].type === value.type, "entry と Binette の type が一致しません。"),
  // 空の Binette から明示的な type: undefined も取り除く。
  v.transform((value) => {
    if (value.type === undefined) delete value.type;
    return value;
  }),
);
