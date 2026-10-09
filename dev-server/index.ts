import { serve } from "@hono/node-server";
import QRCode from "qrcode";
import { createApp } from "./app.ts";
import { createStore } from "./store.ts";

const env = process.env;
const PORT = Number(env.PORT ?? 8787);
const FRONT_URL = env.FRONT_URL ?? "http://localhost:5173/ebina-station";
const SERVER_URL = env.SERVER_URL ?? "http://localhost:8787";
const USER_ID = env.USER_ID ?? "test";
const USER_NAME = env.USER_NAME ?? "テストユーザー";

const front = new URL(FRONT_URL);
const store = createStore();
const app = createApp({ rpID: front.hostname, rpName: "EbinaStation", origin: front.origin }, store);

store.createUser(USER_ID, USER_NAME);
const { token, code, expiresAt } = store.issueRegistrationToken(USER_ID);

serve({ fetch: app.fetch, port: PORT }, async () => {
  const url = `${FRONT_URL}/register?server=${encodeURIComponent(SERVER_URL)}&token=${token}&code=${code}`;
  console.log("=== EbinaStation 開発用サーバー ===");
  console.log(`待ち受け: ${SERVER_URL} (port ${PORT})`);
  console.log(`ユーザー: ${USER_ID} (${USER_NAME})`);
  console.log("");
  console.log("パスキー登録 URL:");
  console.log(url);
  console.log(`有効期限: ${new Date(expiresAt).toLocaleString("ja-JP")} (15 分 / 1 回のみ)`);
  console.log(`確認コード: ${code}`);
  console.log("");
  console.log(await QRCode.toString(url, { type: "terminal", small: true }));
  console.log("注意: データはメモリ上にのみ保持され、再起動すると消えます。");
});
