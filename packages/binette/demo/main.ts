import { createScene } from "binette";

const container = document.querySelector<HTMLElement>("#app");
if (!container) throw new Error("表示先がありません。");
const user = { id: "demo", name: "デモユーザー" };
const themeKey = "binette-demo-theme";
let savedTheme: string | null = null;
try { savedTheme = localStorage.getItem(themeKey); } catch { /* 保存できなくてもデモは使える */ }
document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
let initializing = true;
const initialPath = location.pathname;

const scene = createScene({
  container,
  fetch: (url, init) => {
    if (/^https?:\/\//i.test(url)) return fetch(url, init);
    if (/^[a-z][a-z\d+.-]*:/i.test(url)) throw new Error("対応していない URL です。");
    return fetch(`/station${url.startsWith("/") ? "" : "/"}${url}`, init);
  },
  binette: path => path === "/" ? "/index.bina" : `${path}.bina`,
  entry: "/settings.bina",
  navigate: path => {
    // 入口の取得中も、直接開いたパスと戻る・進むで移動したパスを維持する。
    if (initializing && (initialPath !== "/" || location.pathname !== "/")) return;
    history.pushState(null, "", path);
    void scene.show(location.pathname);
  },
  sh: { user },
  settings: {
    theme: {
      options: [{ value: "light", label: "ライト" }, { value: "dark", label: "ダーク" }],
      get: () => document.documentElement.dataset.theme ?? "light",
      set: value => {
        if (value !== "light" && value !== "dark") return;
        document.documentElement.dataset.theme = value;
        try { localStorage.setItem(themeKey, value); } catch { /* 保存できなくてもテーマは切り替える */ }
      },
    },
    connection: { server: location.origin, user },
    versions: { Binette: "0.1" },
    logout: () => { alert("デモなのでログアウトはありません"); },
  },
  onError: error => console.error(error),
});

window.addEventListener("popstate", () => { void scene.show(location.pathname); });
await scene.start();
initializing = false;
await scene.show(location.pathname);
