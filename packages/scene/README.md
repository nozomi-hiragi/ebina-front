# @binette/scene

ブラウザ上の Scene、アセット解決、Shadow DOM での HTML / JavaScript 再生、設定画面を提供します。依存は `@binette/core` だけで、通信と遷移は呼び出し側が渡します。

```ts
import { createScene } from "@binette/scene";
const scene = createScene({
  container: document.querySelector<HTMLElement>("#app")!,
  fetch: (url, init) => fetch(url, init),
  binette: path => path === "/" ? "/index.bina" : `${path}.bina`,
  entry: "/settings.bina",
  navigate: path => { history.pushState(null, "", path); void scene.show(path); },
  sh: {},
  settings: {},
});
await scene.start();
await scene.show(location.pathname);
// 表示先を破棄するときは scene.dispose() を呼ぶ。
```

ルートで `npm install` 後、別々の端末で `npm run demo -w @binette/coulisses` と `npm run demo -w @binette/scene` を起動し、http://localhost:5175/ を開きます。ホーム、`/hello` の JavaScript、設定画面を試せます。
配信先は既定で http://localhost:8790 です。`VITE_COULISSES` で変更できます（配信側の CORS も接続元に合わせてください）。

`npm run typecheck -w @binette/scene` でデモを含めて型検査します。
