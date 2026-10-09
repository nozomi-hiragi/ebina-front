import { theme, toggleTheme } from "../theme";

export default function ThemeToggle() {
  const isDark = () => theme() === "ebina-dark";
  const label = () => (isDark() ? "ライトモードにする" : "ダークモードにする");

  return (
    <button
      type="button"
      class="grid size-11 place-items-center rounded-[10px] border border-base-300 text-base-content hover:bg-base-200"
      aria-label={label()}
      title={label()}
      onClick={toggleTheme}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        {isDark() ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        )}
      </svg>
    </button>
  );
}
