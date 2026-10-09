import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
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

const str = (v: unknown) => (typeof v === "string" ? v : "");

function bearer(c: Context): string {
  const m = /^Bearer (.+)$/.exec(c.req.header("Authorization") ?? "");
  return m?.[1] ?? "";
}

export function createApp(config: Config, store: Store) {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: config.origin,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.use("*", async (c, next) => {
    await next();
    console.log(`${c.req.method} ${new URL(c.req.url).pathname} ${c.res.status}`);
  });

  app.onError((err, c) => {
    if (err instanceof BadRequest) return c.json({ error: err.message }, 400);
    console.error(err);
    return c.json({ error: "サーバーエラーです" }, 500);
  });

  app.notFound((c) => c.json({ error: "見つかりません" }, 404));

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
    const options = await generateRegistrationOptions({
      rpName: config.rpName,
      rpID: config.rpID,
      userName: user.id,
      userDisplayName: user.name,
      userID: new TextEncoder().encode(user.id),
      attestationType: "none",
      authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
      excludeCredentials: user.passkeys.map((p) => ({ id: p.id, transports: p.transports })),
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
    try {
      const result = await verifyRegistrationResponse({
        response: body.response as RegistrationResponseJSON,
        expectedChallenge: reg.challenge,
        expectedOrigin: config.origin,
        expectedRPID: config.rpID,
      });
      if (!result.verified) return c.json({ error: "パスキーを検証できませんでした" }, 400);
      const { credential } = result.registrationInfo;
      store.addPasskey(reg.user.id, {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: credential.transports,
      });
      store.markRegistrationUsed(token);
      return c.json({ ok: true });
    } catch (e) {
      console.error(e);
      return c.json({ error: "パスキーを検証できませんでした" }, 400);
    }
  });

  app.post("/ebina/login/options", async (c) => {
    const id = str((await readBody(c)).id);
    // ID 省略時はユーザーを特定せず、端末のパスキー選択に任せる
    const user = id ? store.getUser(id) : undefined;
    if (id && (!user || user.passkeys.length === 0)) {
      return c.json({ error: "ユーザーが見つからないか、パスキーが未登録です" }, 404);
    }
    const options = await generateAuthenticationOptions({
      rpID: config.rpID,
      userVerification: "preferred",
      allowCredentials: user?.passkeys.map((p) => ({ id: p.id, transports: p.transports })),
    });
    const sessionId = store.createLoginChallenge(user?.id, options.challenge);
    return c.json({ sessionId, options });
  });

  app.post("/ebina/login/verify", async (c) => {
    const body = await readBody(c);
    const login = store.takeLoginChallenge(str(body.sessionId));
    if (!login) return c.json({ error: "ログインセッションが無効か、期限切れです" }, 404);
    const response = body.response as AuthenticationResponseJSON | undefined;
    const found = response && store.findPasskey(response.id);
    if (!response || !found) return c.json({ error: "このパスキーは登録されていません" }, 401);
    const { user, passkey } = found;
    if (login.userId && login.userId !== user.id) {
      return c.json({ error: "認証に失敗しました" }, 401);
    }
    try {
      const result = await verifyAuthenticationResponse({
        response,
        expectedChallenge: login.challenge,
        expectedOrigin: config.origin,
        expectedRPID: config.rpID,
        credential: passkey,
      });
      if (!result.verified) return c.json({ error: "認証に失敗しました" }, 401);
      passkey.counter = result.authenticationInfo.newCounter;
      const token = store.createAuthSession(user.id);
      return c.json({ token, user: { id: user.id, name: user.name } });
    } catch (e) {
      console.error(e);
      return c.json({ error: "認証に失敗しました" }, 401);
    }
  });

  app.get("/ebina/me", (c) => {
    const user = store.getAuthSessionUser(bearer(c));
    if (!user) return c.json({ error: "認証が必要です" }, 401);
    return c.json({ id: user.id, name: user.name });
  });

  app.post("/ebina/logout", (c) => {
    const token = bearer(c);
    if (!store.getAuthSessionUser(token)) return c.json({ error: "認証が必要です" }, 401);
    store.deleteAuthSession(token);
    return c.json({ ok: true });
  });

  return app;
}
