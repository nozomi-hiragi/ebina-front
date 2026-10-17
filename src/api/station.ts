import { normalizeServer } from "../auth/session";
import { wakeClient, wakeErrorCode } from "../auth/wake";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from "../auth/webauthn";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type User = { id: string; name: string };

async function request<T>(
  server: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const base = normalizeServer(server);
  const headers: Record<string, string> = {};
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

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

export async function getMe(server: string): Promise<User> {
  const client = wakeClient(server);
  let res: Response;
  try {
    await client.reload();
    res = await client.wakeFetch("wake://station/me");
  } catch (err) {
    if (err instanceof ApiError || wakeErrorCode(err)) throw err;
    throw new ApiError(0, "サーバーに接続できませんでした");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // 本文が JSON でない場合は無視
  }

  if (res.status !== 200) {
    let message = `サーバーがエラーを返しました (${res.status})`;
    if (data && typeof data === "object" && "error" in data) {
      const errVal = (data as { error: unknown }).error;
      if (typeof errVal === "string") {
        message = errVal;
      } else if (errVal && typeof errVal === "object" && "code" in errVal) {
        message = String((errVal as { code: unknown }).code);
      }
    }
    throw new ApiError(res.status, message);
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as Record<string, unknown>).id !== "string" ||
    typeof (data as Record<string, unknown>).name !== "string"
  ) {
    throw new ApiError(500, "サーバーの応答が不正です");
  }

  return data as User;
}
