# ebina-front での Binette の使い方

[Binette の仕様](binette.md) のうち、フロントが決めることを、ebina-front がどう決めているかをまとめます。

## 取得（`fetch`）

Scene には `serverURL: "wake://station/"` を渡します。Scene は固定入口 `/index.bina`、画面パスから決めたビネット、asset の `src`、`sh.fetch` の URL を、この取得元を基準に解決します。Scene に渡す `fetch` は、解決済み URL を次のように取ります。

- `wake://…`: WAKE-ET で取る
- `https://…` / `http://…`: 普通の `fetch` で取る

WAKE を通らないもの（`https://…`）は、Station がログイン無しで誰でも取れる形で配ることになります。見られて困るものは、スキーム無しか `wake://` で書きます。

たとえば `/a/b.bina` は `wake://station/a/b.bina` になります。絶対 URL は維持し、相対 URL は `serverURL` のディレクトリを基準に解決します。ログイン先の `active.server` は WAKE の HTTP transport 接続先で、リソース URL の基点である `serverURL` とは別です。

WAKE のセッションが切れていたら（`reauth` など）、ログイン画面へ戻します。

## パスとビネットの対応

Scene の既定動作で `/a/b` は `/a/b.bina`、`/` は `/index.bina` を取得します。`routes` に取得先は書きません。取得方法は上記の URL スキームに従い、取得先が 404 の場合は「見つかりません」を表示します。固定 `/settings` はビネットを取得しません。

`routes` の形と適用範囲は検討中です。入口自身の転送は `/index.bina` の `type: "redirect"` と `content` で指定します。

## Scene を始めるとき

`element` に表示先を渡し、`serverURL: "wake://station/"` と `base: "/ebina-station/"` を指定します。`start()` が初期表示まで行い、以後の URL の更新と戻る・進むは Scene が管理します。`base` は WAKE などの取得先 URL には付きません。

ログインした直後に Scene を始めます。未ログインのときは、トップ（`/`）以外をログイン画面へ移します。ログイン画面と登録画面は ebina-front の画面で、Binette ではありません。

## テーマとログイン情報

テーマの選択は ebina-front の画面側で管理し、`ebina-theme`（localStorage）に保存します。接続先とユーザー情報もログイン用のフロント UI で扱います。これらの情報は Scene の固定 `/settings` には渡しません。
