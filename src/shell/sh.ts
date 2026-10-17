import type { Session } from "../auth/session";
import { isReauthError, wakeClient } from "../auth/wake";

// onReauth: セッション切れのとき。殻はログイン画面へ戻す
export function createShellApi(active: Session, navigate: (path: string) => void, onReauth: () => void) {
  return {
    version: "0.1" as const,
    navigate,
    fetch: async (url: string, init?: RequestInit): Promise<Response> => {
      if (!url.startsWith("wake://")) return fetch(url, init);
      const body = init?.body == null ? undefined : new Uint8Array(await new Response(init.body).arrayBuffer());
      const client = wakeClient(active.server);
      try {
        if (!client.loggedIn) await client.reload();
        const response = await client.wakeFetch(url, {
          method: init?.method,
          headers: init?.headers ? Array.from(new Headers(init.headers).entries()) : undefined,
          body,
        });
        if (response.status === 401) onReauth();
        return response;
      } catch (error) {
        if (isReauthError(error)) onReauth();
        throw error;
      }
    },
    user: { ...active.user },
    server: active.server,
  };
}
