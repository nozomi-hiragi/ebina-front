import { randomBytes, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { convertCOSEtoPKCS } from "@simplewebauthn/server/helpers";
import type {
  AuthenticatorTransport,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import {
  createWakeServer,
  MemoryCredentialStore,
  MemoryWakeStore,
} from "@wake-protocol/server";
import type {
  EtHandler,
  EtHandlerResponse,
  WakeCredential,
  WakeServer,
} from "@wake-protocol/server";
import type { Store } from "./store.ts";

export type Config = {
  rpID: string;
  rpName: string;
  origin: string;
};

class BadRequest extends Error {}

async function readBody(c: Context): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new BadRequest("JSON が正しくありません");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BadRequest("JSON が正しくありません");
  }
  return body as Record<string, unknown>;
}

// P-256 公開鍵の SPKI DER のうち、点（0x04||x||y）より前の固定部分
const P256_SPKI_PREFIX = Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex");

const str = (v: unknown) => (typeof v === "string" ? v : "");

function etJson(status: number, value: unknown): EtHandlerResponse {
  return {
    status,
    headers: [["content-type", "application/json"]],
    body: new TextEncoder().encode(JSON.stringify(value)),
  };
}

export function createApp(config: Config, store: Store) {
  const credentials = new MemoryCredentialStore();
  const wakeStore = new MemoryWakeStore();

  // ET の中の URL は wake://station/… で表す。URL の振り分けはこちらで行う
  const etHandler: EtHandler = (req, auth) => {
    if (req.method === "GET" && req.url === "wake://station/me") {
      const user = store.getUser(auth.userId);
      if (!user) return etJson(404, { error: { code: "not_found" } });
      return etJson(200, { id: user.id, name: user.name });
    }
    // settings.bina はわざと返さない。プレイヤーの基本設定画面を使う。
    if (req.method === "GET" && req.url === "wake://station/index.bina") {
      return etJson(200, {
        binette: "0.1",
        title: "ホーム",
        type: "html",
        content: '<main><p>EbinaStation へようこそ。</p><a href="/hello">サンプルを開く</a></main>',
      });
    }
    if (req.method === "GET" && req.url === "wake://station/hello.bina") {
      return etJson(200, {
        binette: "0.1",
        title: "サンプル",
        type: "js",
        entry: "main",
        assets: {
          main: { type: "js", src: "wake://station/files/hello/main.js" },
          style: { type: "css", content: ".hello { padding: 1rem; } .hello button { min-height: 44px; }" },
        },
      });
    }
    if (req.method === "GET" && req.url === "wake://station/files/hello/main.js") {
      return {
        status: 200,
        headers: [["content-type", "text/javascript; charset=utf-8"]],
        body: new TextEncoder().encode(`export function mount(el, sh) {
  const section = document.createElement("section");
  section.className = "hello";
  const message = document.createElement("p");
  message.textContent = "こんにちは、" + sh.user.name + "さん。";
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "ホームへ戻る";
  button.addEventListener("click", () => sh.navigate("/"));
  section.append(message, button);
  el.append(section);
  return () => section.remove();
}`),
      };
    }
    return etJson(404, { error: { code: "not_found" } });
  };

  const server: WakeServer = createWakeServer({
    rpId: config.rpID,
    loginOrigins: [new URL(config.origin).origin],
    credentials,
    store: wakeStore,
    secret: new Uint8Array(randomBytes(32)),
    etHandler,
  });

  const app = new Hono();

  app.use("*", async (c, next) => {
    await next();
    console.log(`${c.req.method} ${new URL(c.req.url).pathname} ${c.res.status}`);
  });

  app.use(
    "/ebina/*",
    cors({
      origin: config.origin,
      allowHeaders: ["Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      exposeHeaders: ["Content-Type"],
    }),
  );

  app.onError((err, c) => {
    if (err instanceof BadRequest) return c.json({ error: err.message }, 400);
    console.error(err);
    return c.json({ error: "サーバーエラーです" }, 500);
  });

  app.notFound((c) => c.json({ error: "見つかりません" }, 404));

  const handleWake = async (c: Context) => {
    const url = new URL(c.req.url);
    url.pathname = url.pathname.replace(/^\/ebina/, "");
    const req = new Request(url.toString(), c.req.raw);
    const res = await server.handle(req);
    return res ?? c.notFound();
  };

  app.all("/ebina/auth/*", handleWake);
  app.all("/ebina/wake/*", handleWake);

  const invalidToken = (c: Context) =>
    c.json({ error: "登録トークンが無効か、期限切れです" }, 404);

  app.get("/ebina/register/info", (c) => {
    const reg = store.getRegistration(c.req.query("token") ?? "");
    if (!reg) return invalidToken(c);
    return c.json({ id: reg.user.id, name: reg.user.name });
  });

  app.post("/ebina/register/options", async (c) => {
    const body = await readBody(c);
    const token = str(body.token);
    const reg = store.getRegistration(token);
    if (!reg) return invalidToken(c);
    const check = store.checkRegistrationCode(token, str(body.code));
    if (check.status === "invalid") return invalidToken(c);
    if (check.status === "wrong") {
      return c.json(
        { error: `確認コードが違います（残り ${check.remaining} 回）`, remaining: check.remaining },
        403,
      );
    }
    const { user } = reg;
    const existingCreds = await credentials.findUserCredentials(user.id);
    const options = await generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      userName: user.id,
      userDisplayName: user.name,
      userID: new TextEncoder().encode(user.id),
      attestationType: "none",
      supportedAlgorithmIDs: [-7],
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
      excludeCredentials: existingCreds.map((cred) => ({
        id: Buffer.from(cred.credentialId).toString("base64url"),
        transports: cred.transports as AuthenticatorTransport[] | undefined,
      })),
    });
    store.setRegistrationChallenge(token, options.challenge);
    return c.json(options);
  });

  app.post("/ebina/register/verify", async (c) => {
    const body = await readBody(c);
    const token = str(body.token);
    const reg = store.getRegistration(token);
    if (!reg) return invalidToken(c);
    if (!reg.challenge) return c.json({ error: "先に登録を開始してください" }, 400);

    const clientResponse = body.response as (RegistrationResponseJSON & {
      response?: { publicKey?: string; transports?: AuthenticatorTransport[] };
    }) | undefined;
    if (!clientResponse || !clientResponse.rawId) {
      return c.json({ error: "登録情報が不正です" }, 400);
    }

    const publicKeyBase64url = clientResponse.response?.publicKey;
    if (typeof publicKeyBase64url !== "string" || !publicKeyBase64url) {
      return c.json({ error: "公開鍵が見つかりません" }, 400);
    }

    try {
      const result = await verifyRegistrationResponse({
        response: clientResponse,
        expectedChallenge: reg.challenge,
        expectedOrigin: config.origin,
        expectedRPID: config.rpID,
        requireUserVerification: true,
        supportedAlgorithmIDs: [-7],
      });
      if (!result.verified || !result.registrationInfo) {
        return c.json({ error: "パスキーを検証できませんでした" }, 400);
      }

      const { registrationInfo } = result;
      // 保存する鍵は検証済みの COSE から作る。クライアントが送った SPKI は一致するかだけを見る
      const point = convertCOSEtoPKCS(registrationInfo.credential.publicKey);
      if (point.length !== 65 || point[0] !== 0x04) {
        return c.json({ error: "公開鍵の形式が不正です" }, 400);
      }
      const publicKey = Buffer.concat([P256_SPKI_PREFIX, point]);
      const clientKey = Buffer.from(publicKeyBase64url, "base64url");
      if (clientKey.length !== publicKey.length || !timingSafeEqual(clientKey, publicKey)) {
        return c.json({ error: "公開鍵が一致しません" }, 400);
      }

      // 検証済みの ID を使う。既存の ID の上書きは拒否する
      const credentialId = Buffer.from(registrationInfo.credential.id, "base64url");
      if (await credentials.getCredential(credentialId)) {
        return c.json({ error: "このパスキーはすでに登録されています" }, 409);
      }

      const cred: WakeCredential = {
        credentialId,
        userId: reg.user.id,
        userHandle: new TextEncoder().encode(reg.user.id),
        publicKey,
        algorithm: -7,
        signCount: registrationInfo.credential.counter,
        backupEligible: registrationInfo.credentialDeviceType === "multiDevice",
        status: "active",
        ...(clientResponse.response?.transports ? { transports: clientResponse.response.transports } : {}),
      };

      await credentials.setCredential(cred, reg.user.id);
      store.markRegistrationUsed(token);
      return c.json({ ok: true });
    } catch (e) {
      console.error(e);
      return c.json({ error: "パスキーを検証できませんでした" }, 400);
    }
  });

  return app;
}
