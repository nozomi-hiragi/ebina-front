import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { normalizeServer } from "./session";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type User = { id: string; name: string };
export type LoginOptionsResponse = {
  sessionId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
};
export type LoginVerifyResponse = { token: string; user: User };

async function request<T>(
  server: string,
  path: string,
  init: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const base = normalizeServer(server);
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.token) headers.Authorization = `Bearer ${init.token}`;

  let res: Response;
  try {
    res = await fetch(`${base}/ebina${path}`, {
      method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "サーバーに接続できませんでした");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // 本文が JSON でない場合は無視
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `サーバーがエラーを返しました (${res.status})`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export function getRegisterInfo(server: string, token: string) {
  return request<User>(server, `/register/info?token=${encodeURIComponent(token)}`);
}

export function getRegisterOptions(server: string, token: string, code: string) {
  return request<PublicKeyCredentialCreationOptionsJSON>(server, "/register/options", {
    body: { token, code },
  });
}

export function verifyRegister(server: string, token: string, response: RegistrationResponseJSON) {
  return request<{ ok: true }>(server, "/register/verify", { body: { token, response } });
}

export function getLoginOptions(server: string, id?: string) {
  return request<LoginOptionsResponse>(server, "/login/options", { body: id ? { id } : {} });
}

export function verifyLogin(server: string, sessionId: string, response: AuthenticationResponseJSON) {
  return request<LoginVerifyResponse>(server, "/login/verify", { body: { sessionId, response } });
}

export function getMe(server: string, token: string) {
  return request<User>(server, "/me", { token });
}

export function logout(server: string, token: string) {
  return request<{ ok: true }>(server, "/logout", { method: "POST", body: {}, token });
}
