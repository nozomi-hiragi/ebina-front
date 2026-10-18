# @binette/scene

ブラウザ上の Scene、アセット解決、Shadow DOM での HTML / JavaScript 再生、設定画面を提供します。依存は `@binette/core` だけです。Scene が URL と戻る・進むを管理し、通信は必要に応じて差し替えられます。

```ts
import { Scene } from "@binette/scene";
const scene = new Scene({
  element: document.querySelector<HTMLElement>("#app")!,
  serverURL: "https://example.com/", // ビネットや asset の取得元
  base: "/", // 省略時も /
});
await scene.start();
// 表示先を破棄するときは scene.dispose() を呼ぶ。
```

起動時は固定の `/index.bina` を取得します。`/` では入口の中身を表示し、入口が `type: "redirect"` なら、その `content` へ転送します（`routes["/"].redirect` には書きません）。直接開いた他のパスは維持します。`/settings` は Scene の固定画面です。通常は画面パスに `.bina` を付けて取得し（`/` は `/index.bina`）、取得先が 404 なら「見つかりません」を表示します。`routes` に `binette` は書きません。`serverURL` は必須の取得元 URL です。Binette・asset の `src`・`sh.fetch` の URL を `new URL(url, serverURL)` で解決してから、選択した `fetch` に渡します。絶対 URL は維持し、`/` 始まりは取得元のオリジン、相対 URL は取得元のディレクトリを基準にします。固定入口 `/index.bina` も同じ規則で解決します。`fetch` を省略するとブラウザ標準の `fetch` を使います。`base` は画面の URL にだけ適用し、ビネットや asset の取得先には付けません。

ルートで `npm install` 後、別々の端末で次を起動します。

```sh
npm run demo -w @binette/coulisses
npm run demo -w @binette/scene
```

http://localhost:5175/ を開くと、ホーム、`/hello` の JavaScript、`/redirect` からの転送、設定画面を試せます。上部の「標準 fetch」「カスタム fetch」で通信を切り替えられます。切替時は現在の画面を再読み込みし、選択は同じタブの画面遷移・再読み込み後も保持します。初回は標準 fetch です。

- `http://localhost:5175/?fetch=default`: `Scene` の `fetch` オプションを省略し、ブラウザ標準の fetch で指定した `serverURL` の Coulisses から直接取得します。
- `http://localhost:5175/?fetch=custom`: カスタム fetch が解決済みの URL を開発者コンソールへ「カスタム fetch:」として記録し、同じ Coulisses から直接取得します。

どちらのモードでも Coulisses が必要で、配信側は `http://localhost:5175` からの CORS を許可する必要があります。配信先は既定で `http://localhost:8790`。変更する場合は `VITE_COULISSES=http://localhost:8791 npm run demo -w @binette/scene` のように起動するか、`packages/scene/demo/.env.local` に `VITE_COULISSES=http://localhost:8791` を設定して Vite を再起動します。両モードの `serverURL` に反映します。別ポートのデモ配信は `PORT=8791 npm run demo -w @binette/coulisses` で起動できます。

`type: "redirect"` は `content` に書かれた Scene 内パスへ履歴を置き換えて移動します。`type: "settings"` は `/settings.bina` 専用です。`routes` の形は検討中で、通常の取得先を並べる対応表にはしません。

固定 `/settings` は General と、`/settings.bina` の `sections` を優先度順に表示します。テーマやログアウトなど利用側フロントの操作は、フロントが `components` で登録した部品を element セクションから指定して出します。

`npm run typecheck -w @binette/scene` でデモを含めて型検査します。
