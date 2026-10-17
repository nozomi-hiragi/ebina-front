import { Show } from "solid-js";
import { theme, toggleTheme } from "../shell/theme";
import { Button, MoonIcon, SunIcon } from "./ui";

export default function ThemeToggle() {
  const isDark = () => theme() === "ebina-dark";
  const label = () => (isDark() ? "ライトモードにする" : "ダークモードにする");

  return (
    <Button variant="icon" aria-label={label()} title={label()} onClick={toggleTheme}>
      <Show when={isDark()} fallback={<MoonIcon />}>
        <SunIcon />
      </Show>
    </Button>
  );
}
