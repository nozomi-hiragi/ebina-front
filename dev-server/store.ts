// 開発用のインメモリストア。再起動すると消える
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export type User = {
  id: string;
  name: string;
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

const REGISTRATION_TTL = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const newToken = () => randomBytes(32).toString("base64url");

export function createStore() {
  const users = new Map<string, User>();
  const registrationTokens = new Map<string, RegistrationToken>();

  return {
    createUser(id: string, name: string): User {
      const user: User = { id, name };
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
  };
}

export type Store = ReturnType<typeof createStore>;
