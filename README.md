# ebina-front

EbinaStation のフロントエンド（v2、SolidJS で作り直し中）。

## 状態

現在は画面のみ実装しています（トップ / ログイン / ダッシュボード / 設定）。サーバーとの接続やログイン処理はまだ未実装です。

## 技術スタック

- SolidJS 1.9
- @solidjs/router 1.x
- Vite 8
- TypeScript 7
- Tailwind CSS 4
- daisyUI 5

## 開発

前提: Node.js 22 以上（CI は 22.x を使用）

```sh
npm install
npm run dev       # http://localhost:5173/ebina-station/
npm run build     # 型チェック（tsc --noEmit）後、build/ に出力
npm run preview   # build/ の内容をローカルで確認
```

開発サーバーのパスは `/ebina-station/` 配下です。ルート（`/`）では表示されないので注意してください。

## ルーティング

| パス         | ページ                 |
| ------------ | ---------------------- |
| `/`          | トップ（`pages/Top.tsx`） |
| `/login`     | ログイン（`pages/Login.tsx`） |
| `/dashboard` | ダッシュボード（`pages/Dashboard.tsx`、`AppLayout` 内） |
| `/settings`  | 設定（`pages/Settings.tsx`、`AppLayout` 内） |

存在しないパスは `pages/NotFound.tsx` を表示します。

アプリは `/ebina-station/` で配信されます。Vite の `base`（`vite.config.ts`）と Router の `base`（`src/App.tsx`）の両方で指定しています。

## テーマ

`src/index.css` に daisyUI のカスタムテーマ `ebina-light`（既定）と `ebina-dark` を定義しています。

独自トークンとして `muted` / `field` / `marker` / `btn` があり、`text-muted`、`bg-btn` などの Tailwind クラスとして使えます。

テーマの選択は `src/theme.ts` で管理し、localStorage のキー `ebina-theme` に保存します。初回は OS の配色設定に従います。

## ディレクトリ構成

```
src/
├── App.tsx          # ルーティング定義
├── index.tsx        # エントリーポイント
├── index.css        # Tailwind / daisyUI テーマ定義
├── theme.ts         # テーマの状態管理
├── components/      # 共通コンポーネント（AppLayout, PublicHeader, ThemeToggle など）
└── pages/           # 各ページ
public/              # 静的ファイル（favicon.svg, apple-touch-icon.png）
```

## デプロイ

`main` への push で GitHub Actions（`.github/workflows/node-build-pages.yml`）が `npm ci` と `npm run build` を実行し、結果を `nozomi-hiragi/ebina-station` リポジトリの GitHub Pages に公開します。

ビルド後に `build/index.html` を `build/404.html` としてコピーしており、SPA のルーティングに対応しています。

## ライセンス

MIT License。詳細は [LICENSE](./LICENSE) を参照してください。
