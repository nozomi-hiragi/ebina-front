# Binette

Binette の型、形式検証、アセット解決、Shadow DOM での HTML / JavaScript 再生と設定画面を提供するパッケージです。ebina-front、Solid、WAKE に依存せず、通信や遷移は呼び出し側から渡します。TypeScript のまま Vite と tsc から利用します。

```ts
import { createScene } from "binette";

const scene = createScene({
  container: document.querySelector<HTMLElement>("#app")!,
  fetch: (url, init) => fetch(url, init),
  binette: path => path === "/" ? "/index.bina" : `${path}.bina`,
  entry: "/settings.bina",
  navigate: path => {
    history.pushState(null, "", path);
    void scene.show(location.pathname);
  },
  sh: { user: { id: "demo", name: "デモユーザー" } },
  settings: {},
});
await scene.start();
await scene.show(location.pathname);
window.addEventListener("popstate", () => { void scene.show(location.pathname); });
// 表示先を破棄するときは scene.dispose() を呼ぶ。
```

ルートで `npm install` 後、`npm run demo -w binette` で静的ファイルを使う単体デモが起動します（既定は http://localhost:5173/）。ホーム、JavaScript のサンプル、テーマなどの設定を試せます。`/hello` を直接開くこともできます。デモの起動処理は、そのようなパスを入口のリダイレクトより優先します。

`npm run typecheck -w binette` で、デモを含むパッケージ単体の型検査を実行します。

仕様は [Binette の仕様](../../docs/binette.md) を参照してください。
