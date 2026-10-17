import type { Session } from "../session";
import { wakeClient } from "../wake";

export function createShellApi(active: Session, navigate: (path: string) => void) {
  return {
    version: "0.1" as const,
    navigate,
    fetch: async (url: string, init?: RequestInit): Promise<Response> => {
      if (!url.startsWith("wake://")) return fetch(url, init);
      const body = init?.body == null ? undefined : new Uint8Array(await new Response(init.body).arrayBuffer());
      const client = wakeClient(active.server);
      if (!client.loggedIn) await client.reload();
      return client.wakeFetch(url, {
        method: init?.method,
        headers: init?.headers ? Array.from(new Headers(init.headers).entries()) : undefined,
        body,
      });
    },
    user: { ...active.user },
    server: active.server,
  };
}
