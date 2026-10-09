import { useNavigate } from "@solidjs/router";
import { setTheme, theme, type Theme } from "../theme";

const options: { value: Theme; label: string }[] = [
  { value: "ebina-light", label: "ライト" },
  { value: "ebina-dark", label: "ダーク" },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div class="flex flex-col gap-8">
      <h1 class="text-2xl font-bold">設定</h1>

      <section class="flex flex-col gap-3 rounded-box bg-base-200 p-6">
        <h2 class="text-base font-bold">テーマ</h2>
        <div role="group" aria-label="テーマ" class="inline-flex w-fit gap-1 rounded-field border border-base-300 p-1">
          {options.map((option) => {
            const active = () => theme() === option.value;
            return (
              <button
                type="button"
                aria-pressed={active()}
                class="min-h-10 rounded-[8px] px-5 text-sm font-medium text-base-content"
                classList={{ "bg-primary text-primary-content": active() }}
                onClick={() => setTheme(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      <div>
        <button
          type="button"
          class="min-h-12 rounded-[10px] bg-btn px-7 text-base font-medium text-btn-content"
          onClick={() => navigate("/")}
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
