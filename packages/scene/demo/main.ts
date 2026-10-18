import { Scene } from "@binette/scene";

const container = document.querySelector<HTMLElement>("#app");
if (!container) throw new Error("表示先がありません。");
const coulisses = (import.meta.env.VITE_COULISSES || "http://localhost:8790").replace(/\/$/, "");
const modeKey = "binette-demo-fetch";
const requestedMode = new URL(location.href).searchParams.get("fetch");
let savedMode: string | null = null;
try { savedMode = sessionStorage.getItem(modeKey); } catch { /* 保存できなくてもデモは使える */ }
const mode = requestedMode === "default" || requestedMode === "custom"
  ? requestedMode : savedMode === "custom" ? "custom" : "default";
try { sessionStorage.setItem(modeKey, mode); } catch { /* 保存できなくてもデモは使える */ }
const modeStatus = document.querySelector<HTMLElement>("#fetch-status");
if (modeStatus) modeStatus.textContent = mode === "custom"
  ? `現在: カスタム fetch（${coulisses}）`
  : `現在: 標準 fetch（${coulisses}）`;
for (const control of document.querySelectorAll<HTMLButtonElement>("[data-fetch-mode]")) {
  control.setAttribute("aria-pressed", String(control.dataset.fetchMode === mode));
  control.addEventListener("click", () => {
    const url = new URL(location.href);
    url.searchParams.set("fetch", control.dataset.fetchMode!);
    location.assign(url);
  });
}
const themeKey = "binette-demo-theme";
let savedTheme: string | null = null;
try { savedTheme = localStorage.getItem(themeKey); } catch { /* 保存できなくてもデモは使える */ }
document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
const scene = new Scene({
  element: container,
  serverURL: `${coulisses}/`,
  ...(mode === "custom" ? { fetch: (url: string, init?: RequestInit) => {
    console.info("カスタム fetch:", url);
    return fetch(url, init);
  } } : {}),
  onError: error => console.error(error),
});

await scene.start();
