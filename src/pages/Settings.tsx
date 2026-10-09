import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { logout } from "../api";
import { clearSession, session } from "../session";
import { Button, PageTitle } from "../components/ui";
import { setTheme, theme, type Theme } from "../theme";

const options: { value: Theme; label: string }[] = [
  { value: "ebina-light", label: "ライト" },
  { value: "ebina-dark", label: "ダーク" },
];

export default function Settings() {
  const navigate = useNavigate();
  const [busy, setBusy] = createSignal(false);

  const handleLogout = async () => {
    setBusy(true);
    const s = session();
    if (s) {
      try {
        await logout(s.server, s.token);
      } catch {
        // サーバー側の失敗は無視してローカルのセッションを消す
      }
    }
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div class="flex flex-col gap-8">
      <PageTitle>設定</PageTitle>

      <section class="flex flex-col gap-3 rounded-box bg-base-200 p-6">
        <h2 class="text-base font-bold">テーマ</h2>
        <div class="join" role="group" aria-label="テーマ">
          {options.map((option) => {
            const active = () => theme() === option.value;
            return (
              <button
                type="button"
                aria-pressed={active()}
                class="btn join-item"
                classList={{ "btn-primary": active() }}
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <div>
        <Button disabled={busy()} onClick={handleLogout}>
          {busy() ? "ログアウト中…" : "ログアウト"}
        </Button>
      </div>
    </div>
  );
}
