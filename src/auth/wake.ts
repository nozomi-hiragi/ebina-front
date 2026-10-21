import {
  WakeClient,
  indexedDbSessionStore,
  navigatorGetAssertion,
  type AuthenticationResponseJSON,
  type GetAssertion,
  type GetAssertionOptions,
  type SessionStore,
} from "@wake-protocol/client";
import { normalizeServer } from "./session";
import { base64urlToBytes, bytesToBase64url } from "./webauthn";

const stores = new Map<string, SessionStore>();
const clients = new Map<string, WakeClient>();

export function wakeStore(server: string): SessionStore {
  const s = normalizeServer(server);
  let store = stores.get(s);
  if (!store) {
    store = indexedDbSessionStore({ name: `ebina-wake:${s}` });
    stores.set(s, store);
  }
  return store;
}

export function wakeClient(server: string): WakeClient {
  const s = normalizeServer(server);
  let client = clients.get(s);
  if (!client) {
    client = new WakeClient({
      baseUrl: `${s}/ebina`,
      getAssertion: navigatorGetAssertion,
      store: wakeStore(s),
    });
    clients.set(s, client);
  }
  return client;
}

function combineSignals(signals: (AbortSignal | undefined)[]): { signal: AbortSignal; cleanup: () => void } {
  const validSignals = signals.filter((s): s is AbortSignal => s !== undefined);
  if (typeof (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any === "function") {
    return {
      signal: (AbortSignal as unknown as { any: (signals: AbortSignal[]) => AbortSignal }).any(validSignals),
      cleanup: () => {},
    };
  }
  const controller = new AbortController();
  const listeners = new Map<AbortSignal, () => void>();
  for (const s of validSignals) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    const onAbort = () => controller.abort(s.reason);
    listeners.set(s, onAbort);
    s.addEventListener("abort", onAbort, { once: true });
  }
  const cleanup = () => {
    for (const [s, onAbort] of listeners) {
      s.removeEventListener("abort", onAbort);
    }
  };
  return { signal: controller.signal, cleanup };
}

export function conditionalGetAssertion(outerSignal?: AbortSignal, onSelected?: () => void): GetAssertion {
  return async (options: GetAssertionOptions): Promise<AuthenticationResponseJSON> => {
    outerSignal?.throwIfAborted();
    const deadline = Date.now() + options.timeout;
    const timeoutController = new AbortController();
    const timer = setTimeout(() => {
      timeoutController.abort(new DOMException("The operation timed out.", "TimeoutError"));
    }, options.timeout);

    const { signal, cleanup } = combineSignals([outerSignal, timeoutController.signal]);

    try {
      const credential = await navigator.credentials.get({
        mediation: "conditional",
        signal,
        publicKey: {
          ...options,
          challenge: new Uint8Array(options.challenge),
          allowCredentials: options.allowCredentials.map((c) => ({
            type: c.type,
            id: new Uint8Array(base64urlToBytes(c.id)),
            transports: c.transports as AuthenticatorTransport[] | undefined,
          })),
        },
      });

      signal.throwIfAborted();
      if (Date.now() >= deadline) throw new DOMException("The operation timed out.", "TimeoutError");
      if (!credential || credential.type !== "public-key") {
        throw new TypeError("No public-key assertion returned");
      }
      onSelected?.();
      const publicKey = credential as PublicKeyCredential;
      if (typeof publicKey.toJSON === "function") {
        return publicKey.toJSON() as AuthenticationResponseJSON;
      }
      const response = publicKey.response as AuthenticatorAssertionResponse;
      return {
        id: publicKey.id,
        rawId: bytesToBase64url(publicKey.rawId),
        type: "public-key",
        response: {
          clientDataJSON: bytesToBase64url(response.clientDataJSON),
          authenticatorData: bytesToBase64url(response.authenticatorData),
          signature: bytesToBase64url(response.signature),
          userHandle: response.userHandle ? bytesToBase64url(response.userHandle) : null,
        },
        clientExtensionResults: publicKey.getClientExtensionResults() as Record<string, unknown>,
        authenticatorAttachment: publicKey.authenticatorAttachment,
      };
    } catch (err) {
      if (signal.aborted) throw signal.reason;
      throw err;
    } finally {
      clearTimeout(timer);
      cleanup();
    }
  };
}

export function wakeAutofillClient(server: string, signal: AbortSignal, onSelected: () => void): WakeClient {
  const s = normalizeServer(server);
  return new WakeClient({
    baseUrl: `${s}/ebina`,
    getAssertion: conditionalGetAssertion(signal, onSelected),
    fetch: async (input, init) => {
      signal.throwIfAborted();
      const response = await fetch(input, { ...init, signal });
      signal.throwIfAborted();
      return response;
    },
    sleep: (ms) => new Promise<void>((resolve, reject) => {
      signal.throwIfAborted();
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      signal.addEventListener("abort", onAbort, { once: true });
    }),
    store: wakeStore(s),
  });
}

export function wakeErrorCode(err: unknown): string | undefined {
  return err instanceof Error && "code" in err && typeof (err as { code?: unknown }).code === "string"
    ? (err as { code: string }).code
    : undefined;
}

// Station 自身がセッションを拒んだ 401 か。Station はその 401 にだけ Ebina-Station-Error: unauthorized を付ける
// （アプリの応答の ebina- ヘッダーは Station が除くので、アプリの 401 はここで false になる）
export function isStationUnauthorized(response: Response): boolean {
  return response.status === 401 && response.headers.get("ebina-station-error") === "unauthorized";
}

export function isReauthError(err: unknown): boolean {
  if (wakeErrorCode(err) === "reauth") return true;
  if (err && typeof err === "object" && "status" in err && (err as { status?: unknown }).status === 401) {
    return true;
  }
  return false;
}
