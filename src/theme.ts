import { createEffect, createRoot, createSignal } from "solid-js";

export type Theme = "ebina-light" | "ebina-dark";

const STORAGE_KEY = "ebina-theme";

function isTheme(value: unknown): value is Theme {
  return value === "ebina-light" || value === "ebina-dark";
}

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isTheme(saved)) return saved;
  } catch {
    // localStorage may be unavailable (private mode, blocked storage)
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "ebina-dark"
    : "ebina-light";
}

const [theme, setThemeSignal] = createRoot(() => {
  const [value, setValue] = createSignal<Theme>(initialTheme());

  createEffect(() => {
    const current = value();
    document.documentElement.dataset.theme = current;
    try {
      localStorage.setItem(STORAGE_KEY, current);
    } catch {
      // ignore write failures
    }
  });

  return [value, setValue] as const;
});

export { theme };

export function setTheme(next: Theme) {
  setThemeSignal(next);
}

export function toggleTheme() {
  setThemeSignal((prev) => (prev === "ebina-dark" ? "ebina-light" : "ebina-dark"));
}
