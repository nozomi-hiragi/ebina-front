import type { ParentProps } from "solid-js";
import { A } from "@solidjs/router";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const DRAWER_ID = "app-drawer";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/settings", label: "設定" },
];

function closeDrawer() {
  const toggle = document.getElementById(DRAWER_ID) as HTMLInputElement | null;
  if (toggle) toggle.checked = false;
}

export default function AppLayout(props: ParentProps) {
  return (
    <div class="drawer lg:drawer-open min-h-dvh">
      <input id={DRAWER_ID} type="checkbox" class="drawer-toggle" />

      <div class="drawer-content flex min-h-dvh min-w-0 flex-col">
        <header class="flex items-center justify-between gap-4 border-b border-base-300 px-4 py-3">
          <label
            for={DRAWER_ID}
            class="grid size-11 cursor-pointer place-items-center rounded-[10px] border border-base-300 text-base-content hover:bg-base-200 lg:hidden"
            aria-label="メニューを開く"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </label>
          <div class="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main class="flex-1 p-4 sm:p-6 lg:p-10">{props.children}</main>
      </div>

      <div class="drawer-side">
        <label for={DRAWER_ID} aria-label="メニューを閉じる" class="drawer-overlay" />
        <aside class="flex min-h-full w-64 flex-col gap-8 border-r border-base-300 bg-base-200 p-5">
          <A href="/dashboard" class="rounded-[9px] self-start" onClick={closeDrawer}>
            <Logo />
          </A>
          <nav aria-label="メインメニュー">
            <ul class="flex flex-col gap-1">
              {navItems.map((item) => (
                <li>
                  <A
                    href={item.href}
                    onClick={closeDrawer}
                    class="block rounded-[10px] px-4 py-2.5 text-[15px] font-medium text-base-content hover:bg-base-300"
                    activeClass="bg-base-300 font-bold"
                    end
                  >
                    {item.label}
                  </A>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}
