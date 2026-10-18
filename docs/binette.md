# Binette

Binette（ビネット）は、サーバーがクライアントに渡す画面の定義と、それを再生する部品とシェルの約束事です。ファイルの拡張子は `.bina` です。

この文書は、合意した仕様（v0.1）をまとめたものです。ebina-front がこの仕様をどう使うか（パスとファイルの対応、WAKE での取得など）は [ebina-front.md](ebina-front.md) にあります。実装がまだ追いついていない部分は「実装の状況」に書きます。

## 呼び名

| 名前 | 役割 | パッケージ / EbinaStation では |
| --- | --- | --- |
| Binette | Scene と Coulisses が使う形式、型と形式検証 | `@binette/core`（`packages/core`） |
| Coulisses（クーリス、舞台裏） | `.bina` と asset を用意して返すサーバー側 | `@binette/coulisses`（`packages/coulisses`） / Station |
| Scene（シーン、舞台） | `.bina` を受け取って再生するクライアント側の部品（`Scene`） | `@binette/scene`（`packages/scene`） |
| フロント | Scene を組み込むアプリ | ebina-front |

## 責任範囲

Binette は、Scene を組み込むクライアント（以下「フロント」。EbinaStation では ebina-front）が Scene を始めてからの画面だけを扱います。

| 層 | 担当 |
| --- | --- |
| 形式（`.bina` に何を書くか） | Binette |
| 再生（html を置く、js を動かす、転送、後始末） | Binette の Scene |
| シェル（`sh` の API、設定画面） | Binette |
| URL の更新、戻る・進む、既定の画面取得と転送（`routes`）、起動時の行き先 | Binette の Scene |
| ビネットや asset の取得 | 標準 `fetch`、またはフロントが渡す `fetch`。Scene が `serverURL` を基準に URL を解決する |
| ログイン、セッション、通信の仕組み、テーマの保存 | フロント |

Scene は、フロントの通信の仕組み（EbinaStation では WAKE）に依存しません。必要なものは、Scene を始めるときにフロントから受け取ります。

```ts
new Scene({
  element: document.querySelector<HTMLElement>("#app")!,
  serverURL: "https://example.com/",          // ビネットや asset の取得元（必須）
  base: "/",                                 // 画面の URL の範囲。省略時は /
  fetch: (url, init) => frontFetch(url, init), // ビネットと asset を取る関数
});
```

## 形式

中身は JSON です。

### 共通の欄

| 欄 | 型 | 説明 |
| --- | --- | --- |
| `binette` | 文字列 | 形式のバージョン。`"メジャー.マイナー"`（今は `"0.1"`）。後からパッチの桁を足すかもしれない |
| `type` | 文字列 | `html` / `js` / `redirect` |
| `title` | 文字列（任意） | 画面のタイトル。`document.title` などに使う |
| `app` | 文字列（任意） | アプリ ID |

- Scene はメジャーが同じものだけを読みます。マイナーが新しくても、知らない欄は無視して読みます。
- `type`・`content`・`entry` がどれも無いビネットは「中身無し」です。

### `type: "html"` と `type: "js"`

```json
{
  "binette": "0.1",
  "type": "html",
  "title": "ホーム",
  "content": "<p>こんにちは</p><a href=\"/notes\">ノート</a>"
}
```

```json
{
  "binette": "0.1",
  "type": "js",
  "title": "ノート",
  "entry": "main",
  "assets": {
    "main":  { "type": "js",  "src": "/files/notes/main.js" },
    "style": { "type": "css", "content": ".note { color: var(--color-primary); }" },
    "logo":  { "type": "svg", "src": "https://cdn.example.com/notes/logo.svg" }
  }
}
```

- `content`（文字列）と `entry`（`assets` のキー）は、どちらか一方だけを書きます。
- `entry` が指す asset の `type` は、ビネットの `type` と同じにします。
- `assets` のキーは拡張子の無いただの名前です。種類は各 asset の `type` だけで判断します。
- asset は `type` と、`content`（文字列）か `src`（URL）のどちらか一方を持ちます。

### `type: "redirect"`

`content` に Scene 内の転送先パスを書きます。`entry` は使いません。

```json
{
  "binette": "0.1",
  "type": "redirect",
  "content": "/home"
}
```

転送先は `/` 始まりのパスです。外部 URL や `//` 始まりは指定しません。Scene は `base` を付けた画面 URL へ、履歴を置き換えて移動します。転送先で指定されていないクエリとハッシュは引き継ぎ、転送が循環するとエラーを表示します。CSS や JavaScript の asset は再生しません。

### `type: "settings"`

Coulisses の `/settings.bina` にだけ置き、固定の `/settings` に差し込むセクションを `sections` に書きます。`content` と `entry` は使いません。書き方は「設定画面（`/settings`）」を参照してください。

### 入口のメタデータ（暫定）

`routes` の形は検討中です。対象ページからの遷移で転送が必要な場所などをどう記述するか、今後整理します。現時点では既存の動作を維持するため、`routes` と `settings` を `type` に依存しない任意の項目として保持します。Scene が利用するのは入口 `/index.bina` のものです。

```json
{
  "binette": "0.1",
  "type": "redirect",
  "content": "/home",
  "settings": [
    { "app": "notes", "title": "ノート", "path": "/notes/settings" }
  ]
}
```

- `settings`: 固定 `/settings` に並べるアプリの項目。リンク先は通常の HTML・JavaScript などのビネットです。
- `routes`: 遷移時の転送などを書くための項目です。通常のビネットの取得先は書きません。形と適用範囲は検討中です。

## 取得

Scene は、ビネットも asset も、ブラウザ標準の `fetch` で取ります。フロントが `fetch` を渡した場合は、そちらで取ります。固定入口 `/index.bina`、画面パスから決めたビネット、asset の `src`、`sh.fetch` の URL は、必須の `serverURL` を基準に `new URL(url, serverURL).href` で解決してから `fetch` に渡します。絶対 URL は維持し、`/` 始まりは取得元のオリジン、相対 URL は取得元のディレクトリを基準にします。スキームごとの通信方法は `fetch` の実装が決めます。`content` の asset は、その文字列から取り出します。

制約:

- `css` の asset は文字列として `<style>` に入れるため、CSS の中の相対 `url(...)` はページを基準に解決されます。画像やフォントは絶対 URL で書くか、`sh.asset(name)` で取ります。
- `js` は Blob URL から読み込むため、相対 `import` は使えません。エントリーの JavaScript は1つのファイルにまとめ、ほかのファイルは `sh.asset(name)` で取ります。

## 再生

- `html`: 中身を Shadow DOM の中に置きます。中の `<script>` は実行しません。
- `js`: ES モジュールとして読み込み、`mount(el, sh)` を呼びます。`el` は Shadow DOM の中の本文の要素です。`mount` は後始末の関数を返してよく、Scene は画面を離れるときにそれを呼びます。
- `redirect`: `content` のパスへ移動します。画面内容は描きません。
- `css` の asset は、自動で Shadow DOM に適用します。
- Shadow DOM の中の、同じオリジンかつ `base` 配下へのリンクを押すと、Scene がページの再読み込みをせずに画面を移します。リンクの URL はブラウザのページを基準に解決し、`base` 外や外部オリジンへのリンクは通常のページ移動になります。
- 「中身無し」のビネットでは、ベースの UI（タイトルと、設定画面への入口だけの画面）を出します。

アプリはフロントと同じページで動きます。信頼できる Coulisses のアプリだけを動かす前提です。

## シェル（`sh`）

`mount` の第2引数で、アプリが Scene（とフロント）に頼むための API です。

- `version`: シェルの API のバージョン（`"0.1"`）
- `asset(name)`: そのビネットの asset を `Promise<Response>` で取る
- `navigate(path)`: Scene の中のパスへ移る
- `fetch(url, init?)`: Scene と同じ `fetch` で取る
- `storage`（予定）: アプリごとに区切ったクライアント側の保存場所（「ストレージ」を参照）

## ルーティング

### URL の管理

Scene は `start()` で入口を取得し、初期画面まで表示します。以後の画面遷移ではブラウザの URL を更新し、戻る・進むにも追従します。フロントからの遷移処理や、URL を監視して表示を指示する処理は不要です。`dispose()` で URL の監視も終了します。

`base` は Scene が管理する画面 URL の範囲で、省略時は `/` です。たとえば `base: "/ebina-station/"` の場合、Scene 内の `/notes` はブラウザでは `/ebina-station/notes` になります。`sh.navigate` と `routes` のパスは Scene 内のパスです。`base` は取得先 URL には付けません。クエリとハッシュは画面 URL に保持し、`routes` の照合にはパス部分だけを使います。

### パスとビネットの対応

通常の取得先は Scene の既定動作で決めます。`routes` に `binette` を書く必要はありません。

| 画面パス | 取得するビネット |
| --- | --- |
| `/` | `/index.bina` |
| `/notes` | `/notes.bina` |
| `/notes/123` | `/notes/123.bina` |

クエリとハッシュは取得先に含めません。取得先は `serverURL` を基準に解決します。取得先が 404 の場合は「見つかりません」を表示します。固定の `/settings` はビネットを取得しません。

### 入口

Scene を始めると、まず固定の `/index.bina` から入口のビネットを取り、Scene が動いているあいだ覚えておきます。これが Coulisses 全体の設定（`routes` と、設定画面に並べるアプリの項目）です。

### `routes`（検討中）

対象ページからの遷移で、転送が必要な場所などをどう書くかは検討中です。通常の画面とビネットの対応表にはしません。

現状の実装には `{ "redirect": "/new" }` の完全一致による転送が残っていますが、形と適用範囲はまだ最終仕様ではありません。入口自身の転送は `routes["/"].redirect` ではなく、入口の `type: "redirect"` と `content` に書きます。

### 始めたときの行き先

直接開いたパスを維持します。起動時に Scene 内の `/` を開いていて、入口の取得中も URL が変わらなかった場合だけ、次の規則で行き先を決めます。

- 入口自身が `type: "redirect"` なら、その `content` へ移ります。入口の転送を `routes["/"].redirect` には書きません。
- 入口が転送でない場合、現在の暫定実装では `routes` に `/` があればその指定に従います。
- 入口が転送でなく、`routes` に `/` も無ければ、`/settings` へ移ります。
- 起動後に `/` へ移動したときも、入口が転送ならその `content` へ移ります。入口が転送でなく `routes` に `/` も無ければ、既定の `/index.bina` を取得します。

### 固定の URL

`/settings` だけです。Coulisses の `routes` やビネットでは上書きできません。

Scene が始まる前（EbinaStation では未ログインのとき）は、Binette は動きません。ログイン画面や、Scene を始めるかどうかの判断はフロントの実装次第で、この仕様の範囲外です。

## 設定画面（`/settings`）

スマホの設定アプリのような画面です。UI は Binette の仕様で決め打ちです。Scene は `/settings` を開くたびに Coulisses の `/settings.bina` を取り、その `sections` を Scene 自身の General セクションと一緒に並べます。

```json
{
  "binette": "0.1",
  "type": "settings",
  "sections": [
    { "priority": 10, "label": "アカウント", "type": "element", "component": "logout" },
    { "priority": -1, "label": "アプリ", "type": "list", "contents": [
      { "id": "notes", "start": "📝", "label": "ノート", "sections": [
        { "type": "element", "entry": "notes" }
      ] }
    ] }
  ],
  "assets": { "notes": { "type": "js", "src": "/files/notes/settings.js" } }
}
```

- `priority`: 並び順。General は `0` で、小さいほど上に並びます。負の数も書けます。省略すると `0` です。同じ優先度なら General が先、続いて書いた順です。`priority` が効くのは一番上の階層だけです。
- `type: "list"`: 行（`contents`）の一覧です。行は `id`・`label` と、任意の `start`・`end`（文字列）を持ちます。行に `sections` を書くと、押したときにその中身を `/settings/<id>` で開きます。入れ子にできます。
- `type: "element"`: 任意の表示です。`entry`（`assets` の js）か `component`（フロントが登録した部品の名前）のどちらか一方を書きます。どちらも `mount(element, sh)` の形で呼ばれ、後始末の関数を返せます。`entry` の `sh` には `asset(name)` も付きます。
- `/settings.bina` が 404 なら General だけを表示します。`type` が `settings` でなければエラーを表示します。
- 部品はフロントが `new Scene({ components: { logout: (element, sh) => … } })` で登録します。テーマやログアウトなど、フロントにしかできない操作をここで出します。登録されていない名前を指定すると、そのセクションは空のまま `onError` に知らせます。

## ストレージ

- クライアント側: シェルはアプリに `sh.storage` を渡し、保存場所をアプリごとに分けます。設定画面はアプリごとの使用量を出し、削除できます。アプリはフロントと同じページで動くので、`sh.storage` を使わずに直接保存することもできてしまいます。その分は設定画面から見えません。
- サーバー側: 仕様では決めません。Coulisses がアプリの設定項目として用意します。

## 未決のこと

- `routes` の形と適用範囲。対象ページからの遷移や転送をどう記述するか
- `html` / `js` のビネットがどのアプリのものかを、パス（`/notes/…`）で決めるか、`app` の欄で決めるか
- `sh.storage` の API
- アプリがシェルの部品（ヘッダーなど）を使えるようにするか。`<sh-header>` は一旦やめた
- 中身を YAML で書けるようにするか（先頭を見て判断する余地は残すが、仕様には入れない）

## 実装の状況

実装は独立した npm ワークスペースの `packages/core/`（型と形式検証）、`packages/scene/`（再生）、`packages/coulisses/`（ファイル配信）にあります。ebina-front、Solid、WAKE に依存せず、scene と coulisses は core だけに依存します。

実装済み:

- Coulisses の `defineBinette` による形式検証と `createCoulisses` による `.bina`・asset 配信（GET / HEAD、任意の CORS）

- `html` / `js` / `redirect` / `settings` と中身無しの形式検査、`app`、入口の `routes` とアプリの設定一覧
- `new Scene({ element, serverURL, fetch?, base?, … })` による入口の取得、始めたときの遷移、画面切り替えと後始末
- 固定の `/settings` に General と、`/settings.bina`（`type: "settings"`）の `sections` を優先度順に Shadow DOM で表示。element セクションは js の asset か、フロントが `components` で登録した部品
- 中身無し・404 の基本画面、読み込みエラーと再試行
- ビネットと asset は同じ `fetch`（標準、またはフロント提供）で取得。Scene は Solid・WAKE・殻に依存しない
- Scene の入口は固定の `/index.bina`。通常の画面パスには `.bina` を付けて取得し、`routes` に取得先は書かない。専用のログアウト画面とシェルのカスタム要素は廃止

まだのこと:

- `sh.storage` とストレージの設定項目
