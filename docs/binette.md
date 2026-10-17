# Binette

Binette は Station（サーバー）が返す画面定義です。ファイル名の拡張子は `.bina` で、殻は WAKE-ET を通じて取得し、HTML または JavaScript で表示します。現在の形式バージョンは `0.1` です。

## 形式

HTML を直接含める例:

```json
{
  "binette": "0.1",
  "title": "ホーム",
  "type": "html",
  "content": "<sh-header title=\"ホーム\"></sh-header><p>こんにちは</p>"
}
```

JavaScript とアセットを使う例:

```json
{
  "binette": "0.1",
  "title": "Hello",
  "type": "js",
  "entry": "main",
  "assets": {
    "main": { "type": "js", "src": "wake://station/files/hello/main.js" },
    "style": { "type": "css", "content": ".card { color: var(--color-primary); }" },
    "logo": { "type": "svg", "src": "/files/logo.svg" }
  }
}
```

- `binette` は「メジャー.マイナー」形式の文字列です。殻はメジャーが `0` の形式を読みます。マイナーが新しくても未知の欄は無視し、メジャーが異なる場合は対応していない形式として表示します。
- `title` は文字列で、`document.title` に使います。本文の見出しが必要な場合は、Binette 自身が `<sh-header>` などを使って描画します。
- `type` は `html` または `js` です。
- `content` は画面本体の文字列、`entry` は `assets` 内のエントリー名です。両方を同時に指定すると形式エラーになります。`type`、`content`、`entry` がすべて無い場合は「中身無し」として扱い、殻の基本画面を表示します。
- `assets` は拡張子を含まない名前からアセット定義への対応です。各アセットは文字列の `type` と、文字列の `content` または `src` の片方を持ちます。
- `entry` で参照するアセットの `type` は Binette の `type` と一致させます。
- `type` は描画方法を決め、ソースの置き場所は `content` または `entry` で決まります。`type: "html"` では `content` の文字列、または `entry` が指すアセットの文字列を Shadow DOM の HTML として挿入します。`type: "js"` では `content` の文字列、または `entry` が指すアセットの文字列を JavaScript モジュールとして読み込みます。
- `css` 型アセットは画面に自動で適用されます。

## アセットの取得

`content` のアセットはその文字列からレスポンスを作ります。`src` は次の規則で取得します。

- `wake://…` は WAKE-ET の `wakeFetch(src)` で取得します。
- `https://…` と `http://…` は通常の `fetch` で取得します。
- スキームのないパスは接続先 Station の URL を基準に `new URL(src, server + "/")` で解決して、通常の `fetch` で取得します。

## JavaScript のエントリーと殻の API

JavaScript のソースは ES module として読み込まれ、`mount(el, sh)` が呼ばれます。`el` は Binette の Shadow DOM 内の本文要素です。`mount` は画面を組み立て、必要なら後始末用の関数を返します。殻は画面遷移や破棄の際にその関数を呼びます。

`sh` には次の API があります。`asset(name)` はアセットを `Promise<Response>` として取得する関数で、プレイヤーが追加します。

- `version`: 殻 API のバージョン文字列（現在は `"0.1"`）
- `navigate(path)`: 殻内のパスへ移動
- `fetch(url, init?)`: `wake://` URL は WAKE-ET、それ以外は通常の fetch で取得
- `user`: `{ id, name }` 形式のログイン中ユーザー
- `server`: 接続先 Station の URL
- `asset(name)`: 名前を指定したアセットの取得

## 固定 URL と基本画面

- `/` と `/home` は `wake://station/home.bina` を表示します。
- `/settings` は `wake://station/settings.bina` を取得します。Station が 404 を返した場合は、テーマ、接続先、ユーザーを表示し、ログアウトへ移動できる殻の設定画面を表示します。
- `/logout` は殻のログアウト画面です。Station の Binette は使いません。
- その他のパスは同じパスの `.bina` を取得します。例えば `/a/b` は `wake://station/a/b.bina` です。
- 404 のホームは「中身無し」として基本画面を表示します。その他の 404 では「見つかりません」を表示します。基本画面には `<sh-header>` とタイトルがあり、本文は空または状態を示す文言です。
- 取得に再認証が必要な場合はログイン画面へ移動します。それ以外の取得失敗では再試行できるエラー画面を表示します。

## `<sh-header>`

殻は `<sh-header title="…"></sh-header>` カスタム要素を提供します。左側にタイトル、右側に `/settings` へ移動する設定ボタンを表示します。カスタム要素は殻へバブリングする `sh-navigate` イベントを送り、殻が画面遷移を処理します。スタイルは Shadow DOM 内にあり、テーマの CSS 変数を使います。
