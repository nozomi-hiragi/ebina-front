# ebina-front

EbinaStation のフロントエンド（v2、SolidJS で作り直し中）。

## 状態

トップ / ログイン / 登録と、ログイン後の画面を Station から受け取る Binette 形式で表示する殻を実装しています。同梱のテスト用サーバー（`dev-server/`）に対して、パスキー（WebAuthn）の登録と、WAKE によるログイン・セッション管理（KX / SM / ET）が動きます。Binette の仕様は [docs/binette.md](docs/binette.md)、ebina-front での使い方は [docs/ebina-front.md](docs/ebina-front.md) を参照してください。

## 技術スタック

- SolidJS 1.9
- @solidjs/router 1.x
- Vite 8
- TypeScript 7
- Tailwind CSS 4
- daisyUI 5

## 開発

前提: Node.js 22.18 以上（CI は 22.x を使用。dev-server を TS のまま実行するため 22.18 以上が必要）

```sh
npm install
npm run dev         # http://localhost:5173/ebina-station/
npm run dev:server  # テスト用サーバー http://localhost:8787
npm run build       # 型チェック（src/ と dev-server/ の tsc）後、build/ に出力
npm run preview     # build/ の内容をローカルで確認
```

開発サーバーのパスは `/ebina-station/` 配下です。ルート（`/`）では表示されないので注意してください。

### テスト用サーバー

`dev-server/` には認証を試すための開発専用サーバーがあります。本番用のサーバーではありません。Node が TypeScript を直接実行し、Hono と `@wake-protocol/server` を使っています。パスキー登録は WAKE の範囲外のため、`@simplewebauthn/server` で検証します。データはメモリ上にのみ保持します。

起動するとターミナルに登録 URL（QR コード付き）を表示します。環境変数の既定値は次のとおりです。

| 変数         | 既定値                                 | 説明                                                         |
| ------------ | -------------------------------------- | ------------------------------------------------------------ |
| `PORT`       | `8787`                                 | 待ち受けポート                                               |
| `FRONT_URL`  | `http://localhost:5173/ebina-station`  | フロントエンドの URL（WebAuthn の origin / rpID と CORS に使う） |
| `SERVER_URL` | `http://localhost:8787`                | フロントから見たサーバーの URL（登録 URL の `server` に入る）  |
| `USER_ID`    | `test`                                 | 登録するユーザーの ID                                        |
| `USER_NAME`  | `テストユーザー`                       | ユーザーの表示名                                             |

注意点:

- データはメモリ上にのみあるため、再起動すると消えます（登録したパスキーも消えます）。起動するたびに新しい登録 URL を発行します。
- 登録 URL は発行から 15 分以内、かつ 1 回だけ有効です。
- 登録には 4 桁の確認コードも必要です。登録 URL / QR に含まれていて、開くと自動で入力されます（ターミナルにも表示されます）。間違えられるのは 5 回までで、超えると URL は無効になります。
- WebAuthn は https か localhost でしか動きません。スマートフォンで試すには HTTPS が必要ですが、これはまだ未対応です。

#### パスキーでのログインを試す

1. 2 つのターミナルで `npm run dev` と `npm run dev:server` を起動する
2. `dev:server` のターミナルに表示された登録 URL を開く（QR コードを読み取ってもよい）
3. `dev:server` のターミナルに表示された 4 桁の確認コード（URL から入力済み）を確かめ、画面の指示に従ってパスキーを登録する
4. 「ログインへ」を押す
5. ID 欄をクリックすると保存済みのパスキーがオートフィルの候補に出るので、選んでログインする（Chrome / Safari）。ID `test` を入力して「ログイン」を押してもよい（ID が空のときはボタンを押せない）

## ルーティング

| パス         | ページ                 |
| ------------ | ---------------------- |
| `/`          | 未ログイン時はトップ（`pages/Top.tsx`）、ログイン後は Station のホーム Binette |
| `/login`     | ログイン（`pages/Login.tsx`） |
| `/register`  | パスキー登録（`pages/Register.tsx`）。クエリ `server` と `token` が必要で、テスト用サーバーの登録 URL から開く |
| `/home`      | ログイン後、`wake://station/home.bina` |
| `/settings`  | Station の設定 Binette。404 の場合は殻の基本設定画面 |
| `/logout`    | 殻のログアウト画面 |
| その他       | パスに対応する Station の Binette（例: `/a/b` → `wake://station/a/b.bina`） |

ログイン後の画面は Binette を Shadow DOM 内で再生します。`src/binette/` は将来パッケージとして切り出せるよう、殻の Solid コンポーネント、WAKE、セッション管理に依存させません。未ログインのときは、トップ（`/`）以外のパスをログイン画面へ移します。

アプリは `/ebina-station/` で配信されます。Vite の `base`（`vite.config.ts`）と Router の `base`（`src/App.tsx`）の両方で指定しています。

## テーマ

`src/index.css` に daisyUI のカスタムテーマ `ebina-light`（既定）と `ebina-dark` を定義しています。

独自トークンとして `muted` / `field` / `marker` / `btn` があり、`text-muted`、`bg-btn` などの Tailwind クラスとして使えます。

テーマの選択は `src/shell/theme.ts` で管理し、localStorage のキー `ebina-theme` に保存します。初回は OS の配色設定に従います。

ログインには `@wake-protocol/client` を使います。`src/auth/wake.ts` がサーバーごとの WAKE クライアントとセッションストアを管理し、セッション鍵は IndexedDB に保存します。`src/auth/session.ts` は表示用のユーザー情報と接続先だけを localStorage のキー `ebina-session` に保存し、認証トークンは保存しません。接続先のサーバー URL の履歴（最大 5 件、新しい順）は `ebina-servers` に保存します。

## ディレクトリ構成

```
src/
├── App.tsx          # ルーティング定義
├── index.tsx        # エントリーポイント
├── index.css        # Tailwind / daisyUI テーマ定義
├── api/
│   └── station.ts   # テスト用サーバーの API 呼び出し
├── auth/            # 認証・セッション（WAKE、WebAuthn、パスキー）
│   ├── session.ts   # 接続先と表示用ユーザー情報
│   ├── wake.ts      # WAKE クライアント・IndexedDB ストア・条件付き認証
│   ├── webauthn.ts  # WebAuthn 登録オプションと応答の変換
│   ├── passkey.ts   # パスキー操作のエラー文言
│   └── passkeyAutofill.ts # パスキーのオートフィル待機
├── binette/         # Binette の型・検証・アセット解決・再生（殻に依存しない）
├── shell/           # ログイン後の殻と Station 画面
│   ├── storage.ts   # localStorage の読み書き補助
│   └── theme.ts     # テーマの状態管理
├── utils/           # クエリパラメータ補助
├── components/
│   ├── layout/      # AppLayout, PublicLayout
│   ├── ui/          # 共通 UI 部品（Button, PageTitle, icons）
│   └── login/       # ログイン画面専用の部品（serverSelection）
└── pages/            # 各ページ
dev-server/          # テスト用サーバー（index.ts: 起動と登録 URL 表示, app.ts: API, store.ts: メモリ保存）
docs/binette.md      # Binette の仕様（形式、再生、シェル、ルーティング、設定画面）
docs/ebina-front.md  # ebina-front での Binette の使い方
public/              # 静的ファイル（favicon.svg, apple-touch-icon.png）
```

## デプロイ

`main` への push で GitHub Actions（`.github/workflows/node-build-pages.yml`）が `npm ci` と `npm run build` を実行し、結果を `nozomi-hiragi/ebina-station` リポジトリの GitHub Pages に公開します。

ビルド後に `build/index.html` を `build/404.html` としてコピーしており、SPA のルーティングに対応しています。

## ライセンス

MIT License。詳細は [LICENSE](./LICENSE) を参照してください。
