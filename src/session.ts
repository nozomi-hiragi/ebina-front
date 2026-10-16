import { createRoot, createSignal } from "solid-js";
import type { User } from "./api";
import { readStorage, writeStorage } from "./storage";

export type Session = { server: string; user: User };

const SESSION_KEY = "ebina-session";
const SERVERS_KEY = "ebina-servers";
const OLD_SERVER_KEY = "ebina-server";
const MAX_SERVERS = 5;

function loadSession(): Session | null {
  const raw = readStorage(SESSION_KEY);
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (
      typeof s?.server === "string" &&
      typeof s?.user?.id === "string" &&
      typeof s?.user?.name === "string"
    ) {
      const loaded: Session = {
        server: s.server,
        user: {
          id: s.user.id,
          name: s.user.name,
        },
      };
      if ("token" in s) writeStorage(SESSION_KEY, JSON.stringify(loaded));
      return loaded;
    }
  } catch {
    // 壊れた値は無視
  }
  return null;
}

const [session, setSession] = createRoot(() => createSignal<Session | null>(loadSession()));

export { session };

export function saveSession(next: Session) {
  writeStorage(SESSION_KEY, JSON.stringify(next));
  setSession(next);
}

// 他タブが書き換えた localStorage の値を読み直す
export function reloadSession() {
  setSession(loadSession());
}

export function clearSession() {
  writeStorage(SESSION_KEY, null);
  setSession(null);
}

// サーバーURLの比較用に、前後の空白と末尾のスラッシュを取り除く
export function normalizeServer(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function writeServers(list: string[]) {
  writeStorage(SERVERS_KEY, JSON.stringify(list));
}

export function savedServers(): string[] {
  const raw = readStorage(SERVERS_KEY);
  if (raw === null) {
    // 旧キー（単一のサーバー）からの移行
    const old = readStorage(OLD_SERVER_KEY);
    if (old === null) return [];
    writeStorage(OLD_SERVER_KEY, null);
    const seeded = normalizeServer(old) ? [normalizeServer(old)] : [];
    writeServers(seeded);
    return seeded;
  }
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.filter((v): v is string => typeof v === "string" && v !== "").slice(0, MAX_SERVERS);
    }
  } catch {
    // 壊れた値は無視
  }
  return [];
}

export function addSavedServer(url: string) {
  const u = normalizeServer(url);
  if (!u) return;
  writeServers([u, ...savedServers().filter((v) => v !== u)].slice(0, MAX_SERVERS));
}

export function removeSavedServer(url: string) {
  const u = normalizeServer(url);
  writeServers(savedServers().filter((v) => v !== u));
}
