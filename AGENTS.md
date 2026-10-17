# AGENTS.md

AI エージェント向けの作業ルール。人間向けの説明は [README.md](README.md) を参照。

## プロジェクト概要

- EbinaStation のフロントエンド。v2 として SolidJS で作り直し中
- 現在はトップ / ログイン / 登録、パスキー登録と WAKE（KX / SM / ET）によるログイン・セッション管理、Station から受け取る Binette の再生まで。ログイン後はプレイヤーが入口 `/settings.bina` を読み、入口のルート指定が無ければ固定の `/settings` を表示する。設定画面とログアウト処理はプレイヤーの設定項目として提供し、それ以外はパスに対応する Binette を表示する（`/` は `/index.bina`）。シェルのカスタム要素は登録しない
- Binette の仕様は `docs/binette.md`、ebina-front での使い方（パスとビネットの対応、WAKE での取得など）は `docs/ebina-front.md` を参照。`src/binette/` は将来の切り出しに備え、Solid、`src/auth/wake.ts`、`src/auth/session.ts` など殻のコードに依存させない。必要な機能は引数で受け取る
- 旧 React 版は git の履歴にある。必要な機能は履歴を参考にしつつ、そのまま移植せず作り直す

## 役割分担

モデルを 3 段階に分け、作業内容によって担当を決める。

| 区分 | モデル | 担当 |
| --- | --- | --- |
| 高 | Opus, Sol6.1 Ultra, Astra | 方針決定、設計、指示出し、進捗の監視、レビュー、最終確認 |
| 中 | Sonnet, Sol | 複雑な実装（状態管理、認証、API 層、複数ファイルにまたがる設計判断を含むもの） |
| 低 | Haiku, Luna | 仕様が明確な実装、画面作成、修正、ドキュメント作成、定型作業 |

### 高モデルの進め方

- 実装は自分でせず、中・低モデルのサブエージェントに任せる。小さな修正も原則として差し戻す
- 中モデルに任せるかどうかは、判断を要する箇所の多さで決める。迷ったら低モデルで始め、詰まったら中モデルに切り替える
- 互いに干渉しない作業は並列で任せてよい。同じファイルを触る作業は順番に任せる
- サブエージェントの報告をそのまま信じない。差分を読み、`npm run build` を自分でも実行して確かめる
- ユーザーへの報告は、検証したことと未検証のこと（ブラウザでの見た目など）を分けて書く

### 指示の書き方（高 → 中・低）

指示には次を必ず含める。受け手は会話の文脈を持っていない前提で書く。

1. 作業ディレクトリ（絶対パス）
2. 目的と、やらないこと（範囲外のファイル、未実装のままにする処理）
3. 参照すべきファイル・仕様（パスで指定）
4. 具体的な手順と、従うべき規約（このファイルの該当節を示してよい）
5. 完了条件（例: `npm run build` が通る）
6. 報告してほしい内容（変更したファイル、ビルド結果、推測で決めた点）

### 報告の書き方（中・低 → 高）

- 変更・作成・削除したファイルの一覧
- `npm run build` の結果（末尾数行）
- 仕様に無く、自分で決めた点や推測した点
- 指示どおりにできなかった点とその理由

### レビュー観点

- 指示と仕様に合っているか。範囲外の変更が混ざっていないか
- Solid の書き方として正しいか（下記「コーディング規約」）
- 色・角丸などが直書きされず、テーマのトークンを使っているか。ライトとダークの両方で成り立つか
- アクセシビリティ（ボタンの `aria-label`、ラベルと入力の対応、タップ領域 44px 以上）
- スマホ幅（〜375px）で崩れないか
- 余計な依存パッケージが増えていないか

## 開発コマンド

```sh
npm install
npm run dev         # http://localhost:5173/ebina-station/
npm run dev:server  # テスト用サーバー http://localhost:8787（dev-server/）
npm run build       # tsc --noEmit + dev-server の tsc + vite build（build/ に出力）
npm run preview
```

- Node.js 22.18 以上（dev-server を TS のまま実行するため）
- 作業の完了前に必ず `npm run build` を通す。確認用に作った `build/` は消してよい。`dev-server/` の型も `npm run build` で検査される
- テストはまだ無い

## 技術スタックと構成

- SolidJS + @solidjs/router + Vite + TypeScript
- Tailwind CSS v4 + daisyUI v5
- アプリは `/ebina-station/` 配下で配信する（`vite.config.ts` の `base` と `src/App.tsx` の Router `base`）
- テスト用サーバー（`dev-server/`）: Node で TS を直接実行、Hono、`@wake-protocol/server`、メモリ保存。登録は WAKE の範囲外で `@simplewebauthn/server` による検証を残す。開発専用で、本番サーバーではない

- フロントのログイン・セッションは `@wake-protocol/client` を使う。セッション鍵はサーバーごとに分けた IndexedDB に保存し、localStorage は接続先と表示用ユーザー情報だけを持つ（認証トークンは保存しない）

```
src/
├── App.tsx        # ルーティング
├── index.tsx      # エントリーポイント
├── index.css      # Tailwind / daisyUI テーマ
├── api/station.ts # テスト用サーバーの API 呼び出し
├── auth/          # 認証・セッション（session, wake, webauthn, passkey, passkeyAutofill）
├── binette/       # Binette の型・検証・アセット解決・再生（殻に依存させない）
├── shell/         # ログイン後の殻と Station 画面
│   ├── storage.ts # localStorage の読み書き補助
│   └── theme.ts   # テーマの状態
├── utils/         # クエリパラメータ補助
├── components/
│   ├── layout/    # AppLayout, PublicLayout
│   ├── ui/        # 共通 UI 部品（Button, PageTitle, icons）
│   └── login/     # ログイン画面専用の部品（serverSelection）
└── pages/         # 画面（1 画面 1 ファイル）
dev-server/        # テスト用サーバー（index.ts, app.ts, store.ts）
docs/binette.md    # Binette の仕様（形式、再生、シェル、ルーティング、設定画面）
docs/ebina-front.md # ebina-front での Binette の使い方
public/            # favicon.svg, apple-touch-icon.png
```

### dev-server のルール

- Node が TS を直接実行するため、erasable な構文だけを使う（`enum`、`namespace`、パラメータプロパティは使わない）
- import は相対パスで、拡張子 `.ts` を付ける
- `src/api/station.ts` と `dev-server/app.ts` の API 契約（パス・リクエスト・レスポンス）は必ず両方いっしょに変える
- WAKE-ET で運ぶ URL は `wake://station/…` で表す（例: `wake://station/me`）。振り分けは `dev-server/app.ts` の `etHandler` で行い、未知の URL には 404 `{"error":{"code":"not_found"}}` を返す

## コーディング規約

### Solid

- React の書き方を持ち込まない。`class`（`className` ではない）、`createSignal` / `createStore`
- props を分割代入しない（リアクティブ性が失われる）。必要なら `splitProps` / `mergeProps`
- リストは `<For>`、条件分岐は `<Show>` / `<Switch>`。動的な値のリストに `.map` を使わない
- 条件分岐は原則 `<Show>` / `<Switch>` で DOM ごと出し分ける。CSS で隠す（`classList={{ hidden: … }}`）のは、DOM を残す必要があるときだけ（非制御の入力状態・フォーカス・アニメーション、WebAuthn オートフィル用の入力欄のように要素自体が必要な場合）
- リンクは `@solidjs/router` の `<A>`、画面遷移は `useNavigate`
- 状態は使う場所の近くに置く。複数画面で共有するものだけ適切な役割別ディレクトリのモジュールに置く（例: `src/shell/theme.ts`）

### スタイル

- 見た目は Tailwind のクラスで書く。インラインの `style` は、グラデーションなど Tailwind で書きにくいものだけにする
- 色はテーマのトークンを使う（`bg-base-200`, `text-base-content`, `bg-primary` など）。独自トークン `text-muted` / `border-field` / `bg-marker` / `bg-btn` / `text-btn-content` もある
- 色の値を直接書かない。新しい色が必要なら `src/index.css` の両テーマに追加する
- 角丸: ボタン・入力 10px、カード 16px（`rounded-box`）
- 入力欄・ボタンの高さ（`--size-field`）と入力欄の枠線の色は `src/index.css` のテーマで決める。daisyUI のクラス（`input`, `select`, `btn`, `join`, `alert`, `toggle`, `checkbox`）を直接使い、個別に高さや枠線を上書きしない
- フォントは IBM Plex Sans JP、等幅は IBM Plex Mono（`font-mono`）

### 共通部品

- 共通の UI 部品は `src/components/ui/` に置く: `Button` / `LinkButton` / `buttonClass`、`PageTitle`、`icons`
- クラス文字列やインライン SVG を画面に直接書かない。同じパターンが 2 回出たら部品に切り出す
- 特定の画面だけで使う複合部品は `src/components/<画面名>/` に置く
- 画面（`src/pages/`）は部品の組み立てが中心になるようにし、状態とハンドラ以外は書き込みすぎない

### 文言・その他

- 画面の文言は日本語
- コメントは必要な箇所だけ、日本語で書く
- ファイルは小さく保つ。1 つのコンポーネントが大きくなったら分ける

## デザイン

- 色や余白の基準は `src/index.css` のテーマと既存画面
- 新しい画面にデザインが無い場合は、既存画面と同じトークン・余白・角丸で最小限に作り、その旨を報告する

## Git

- コミット・push はユーザーに頼まれたときだけ行う
- コミットメッセージは日本語。1 行目に変更の要約を書く
- 作業前に `git status` を確認し、自分が触っていない変更を勝手にコミット・破棄しない
- `legacy/` と `Static Shell App.html` は一時的に置いているローカルのファイル。編集・コミットしない
- ファイルを消すときは変数を使わず絶対パスで指定する

## デプロイ

- `main` への push で GitHub Actions がビルドし、`nozomi-hiragi/ebina-station` の GitHub Pages に公開する
- 出力先は `build/`（ワークフローがこのパスを前提にしている）。変える場合はワークフローも直す
