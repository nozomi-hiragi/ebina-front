# ebina-front での Binette の使い方

[Binette の仕様](binette.md) のうち、フロントが決めることを、ebina-front がどう決めているかをまとめます。

## 取得（`fetch`）

Scene に渡す `fetch` は、次のように取ります。

- スキームの無い URL（`/a/b.bina`、`/files/notes/main.js` など）: 前に `wake://station` を付け、WAKE-ET で取る（`wake://station/a/b.bina`）
- `wake://…`: WAKE-ET で取る
- `https://…` / `http://…`: 普通の `fetch` で取る

WAKE を通らないもの（`https://…`）は、Station がログイン無しで誰でも取れる形で配ることになります。見られて困るものは、スキーム無しか `wake://` で書きます。

WAKE のセッションが切れていたら（`reauth` など）、ログイン画面へ戻します。

## パスとビネットの対応

- `/a/b` → `/a/b.bina`
- `/` → `/index.bina`
- 入口の設定のビネット → `/settings.bina`

`routes` に書かれていないパスは、この対応で取ります。

## Scene を始めるとき

ログインした直後に Scene を始めます。未ログインのときは、トップ（`/`）以外をログイン画面へ移します。ログイン画面と登録画面は ebina-front の画面で、Binette ではありません。

## シェルの設定項目の中身

| 項目 | ebina-front での処理 |
| --- | --- |
| テーマ | `ebina-theme`（localStorage）に保存する独自実装 |
| 接続先・ユーザー | ログイン時に保存した接続先と、`wake://station/me` で取ったユーザー |
| ログアウト | WAKE のログアウト（`wake/logout`）をして、ログイン画面へ |

## `sh` に渡すもの

- `user`: ログイン中のユーザー `{ id, name }`
- `fetch`: 上の「取得」と同じ
