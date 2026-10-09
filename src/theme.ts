import { createEffect, createRoot, createSignal } from "solid-js";
import { readStorage, writeStorage } from "./storage";

export type Theme = "ebina-light" | "ebina-dark";

const STORAGE_KEY = "ebina-theme";

function isTheme(value: unknown): value is Theme {
  return value === "ebina-light" || value === "ebina-dark";
}

function initialTheme(): Theme {
  const saved = readStorage(STORAGE_KEY);
  if (isTheme(saved)) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "ebina-dark"
    : "ebina-light";
}

const [theme, setThemeSignal] = createRoot(() => {
  const [value, setValue] = createSignal<Theme>(initialTheme());

  createEffect(() => {
    const current = value();
    document.documentElement.dataset.theme = current;
    writeStorage(STORAGE_KEY, current);
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
