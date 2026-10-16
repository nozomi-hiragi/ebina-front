import { Show, createEffect, on, onCleanup, type ParentProps } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { MenuIcon, buttonClass } from "./ui";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { getMe } from "../api";
import { clearSession, reloadSession, saveSession, session } from "../session";
import { isReauthError, wakeClient, wakeStore } from "../wake";

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
  const navigate = useNavigate();

  // 未ログインならログイン画面へ。ログアウト時（session が null になった時）も同様
  createEffect(() => {
    if (!session()) navigate("/login", { replace: true });
  });

  // ログアウトは接続先に依らないので、リスナーは 1 つでよい
  const onStorage = (event: StorageEvent) => {
    if (event.key !== "ebina-session") return;
    if (!event.newValue) {
      clearSession();
      navigate("/login", { replace: true });
    } else {
      reloadSession();
    }
  };
  window.addEventListener("storage", onStorage);
  onCleanup(() => window.removeEventListener("storage", onStorage));

  // 接続先が変わるたびに、そのサーバーのセッションの検証と購読を張り直す
  createEffect(
    on(
      () => session()?.server,
      (server) => {
        if (!server) return;
        let disposed = false;
        const redirectToLogin = () => {
          if (disposed || session()?.server !== server) return;
          clearSession();
          navigate("/login", { replace: true });
        };
        const checkSession = async () => {
          try {
            const activeSession = await wakeClient(server).reload();
            if (!activeSession) {
              redirectToLogin();
              return;
            }
            if (disposed) return;
            // 他タブで別のユーザーとしてログインし直した場合も、表示を WAKE のセッションに合わせる
            const user = await getMe(server);
            const current = session();
            if (!disposed && current?.server === server && (current.user.id !== user.id || current.user.name !== user.name)) {
              saveSession({ server, user });
            }
          } catch (err) {
            if (isReauthError(err)) redirectToLogin();
            // 通信エラーなどの場合は画面をそのまま残す
          }
        };
        const unsubscribeStore = wakeStore(server).subscribe(() => {
          void checkSession();
        });
        onCleanup(() => {
          disposed = true;
          unsubscribeStore();
        });
        void checkSession();
      },
    ),
  );

  return (
    <Show when={session()}>
      {(s) => (
        <div class="drawer lg:drawer-open min-h-dvh">
          <input id={DRAWER_ID} type="checkbox" class="drawer-toggle" />

          <div class="drawer-content flex min-h-dvh min-w-0 flex-col">
            <header class="flex items-center justify-between gap-4 border-b border-base-300 px-4 py-3">
              <label
                for={DRAWER_ID}
                class={buttonClass("icon", { class: "lg:hidden" })}
                aria-label="メニューを開く"
              >
                <MenuIcon />
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
              <div class="mt-auto flex flex-col gap-0.5 border-t border-base-300 pt-4">
                <p class="text-sm font-bold break-all">{s().user.name}</p>
                <p class="font-mono text-xs break-all text-muted">{s().user.id}</p>
              </div>
            </aside>
          </div>
        </div>
      )}
    </Show>
  );
}
