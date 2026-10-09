// 開発用のインメモリストア。再起動すると消える
import { randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";

export type Passkey = {
  id: string;
  publicKey: Uint8Array<ArrayBuffer>;
  counter: number;
  transports?: string[];
};

export type User = {
  id: string;
  name: string;
  passkeys: Passkey[];
};

type RegistrationToken = {
  userId: string;
  expiresAt: number;
  used: boolean;
  code: string;
  attempts: number;
  challenge?: string;
};

export type CodeCheck = { status: "ok" } | { status: "wrong"; remaining: number } | { status: "invalid" };

type LoginChallenge = {
  userId?: string;
  challenge: string;
  expiresAt: number;
};

type AuthSession = {
  userId: string;
  expiresAt: number;
};

const REGISTRATION_TTL = 15 * 60 * 1000;
const LOGIN_TTL = 5 * 60 * 1000;
const SESSION_TTL = 24 * 60 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const newToken = () => randomBytes(32).toString("base64url");

export function createStore() {
  const users = new Map<string, User>();
  const registrationTokens = new Map<string, RegistrationToken>();
  const loginChallenges = new Map<string, LoginChallenge>();
  const authSessions = new Map<string, AuthSession>();

  return {
    createUser(id: string, name: string): User {
      const user: User = { id, name, passkeys: [] };
      users.set(id, user);
      return user;
    },
    getUser(id: string): User | undefined {
      return users.get(id);
    },

    issueRegistrationToken(userId: string): { token: string; code: string; expiresAt: number } {
      const token = newToken();
      const code = randomInt(0, 10000).toString().padStart(4, "0");
      const expiresAt = Date.now() + REGISTRATION_TTL;
      registrationTokens.set(token, { userId, expiresAt, used: false, code, attempts: 0 });
      return { token, code, expiresAt };
    },
    // 確認コードを照合する。失敗が上限に達したらトークンを無効にする
    checkRegistrationCode(token: string, code: string): CodeCheck {
      const t = registrationTokens.get(token);
      if (!t || t.used || t.expiresAt <= Date.now()) return { status: "invalid" };
      const a = Buffer.from(t.code);
      const b = Buffer.from(code);
      if (a.length === b.length && timingSafeEqual(a, b)) return { status: "ok" };
      t.attempts++;
      if (t.attempts >= MAX_CODE_ATTEMPTS) t.used = true;
      return { status: "wrong", remaining: Math.max(0, MAX_CODE_ATTEMPTS - t.attempts) };
    },
    // 有効（存在・未使用・期限内）なトークンのユーザーを返す
    getRegistration(token: string): { user: User; challenge?: string } | undefined {
      const t = registrationTokens.get(token);
      if (!t || t.used || t.expiresAt <= Date.now()) return undefined;
      const user = users.get(t.userId);
      return user && { user, challenge: t.challenge };
    },
    setRegistrationChallenge(token: string, challenge: string) {
      const t = registrationTokens.get(token);
      if (t) t.challenge = challenge;
    },
    markRegistrationUsed(token: string) {
      const t = registrationTokens.get(token);
      if (t) t.used = true;
    },

    addPasskey(userId: string, passkey: Passkey) {
      users.get(userId)?.passkeys.push(passkey);
    },

    createLoginChallenge(userId: string | undefined, challenge: string): string {
      const sessionId = randomUUID();
      loginChallenges.set(sessionId, { userId, challenge, expiresAt: Date.now() + LOGIN_TTL });
      return sessionId;
    },
    // 取り出すと同時に削除する（1 回限り）
    takeLoginChallenge(sessionId: string): { userId?: string; challenge: string } | undefined {
      const c = loginChallenges.get(sessionId);
      loginChallenges.delete(sessionId);
      if (!c || c.expiresAt <= Date.now()) return undefined;
      return { userId: c.userId, challenge: c.challenge };
    },
    // 全ユーザーからクレデンシャル ID でパスキーを探す
    findPasskey(credentialId: string): { user: User; passkey: Passkey } | undefined {
      for (const user of users.values()) {
        const passkey = user.passkeys.find((p) => p.id === credentialId);
        if (passkey) return { user, passkey };
      }
      return undefined;
    },

    createAuthSession(userId: string): string {
      const token = newToken();
      authSessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL });
      return token;
    },
    getAuthSessionUser(token: string): User | undefined {
      const s = authSessions.get(token);
      if (!s) return undefined;
      if (s.expiresAt <= Date.now()) {
        authSessions.delete(token);
        return undefined;
      }
      return users.get(s.userId);
    },
    deleteAuthSession(token: string) {
      authSessions.delete(token);
    },
  };
}

export type Store = ReturnType<typeof createStore>;
