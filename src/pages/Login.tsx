import { useNavigate } from "@solidjs/router";
import PublicHeader from "../components/PublicHeader";

const inputClass =
  "h-12 w-full rounded-[10px] border border-field bg-base-100 px-3.5 text-[15px] font-normal text-base-content outline-none focus:outline-2 focus:outline-solid focus:outline-primary";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div class="flex min-h-dvh flex-col">
      <PublicHeader />
      <main class="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-16">
        <section class="flex w-full max-w-[420px] flex-col gap-7 rounded-[16px] border border-t-4 border-base-300 border-t-marker bg-base-200 px-[clamp(20px,5vw,36px)] py-9">
          <div class="flex flex-col gap-3">
            <h1 class="text-[26px] font-bold">サーバーに接続</h1>
            <p class="text-sm leading-[1.7] text-muted">
              接続先のサーバーとIDを入力してください。
            </p>
          </div>

          <form class="flex flex-col gap-5" onSubmit={handleSubmit}>
            <label class="flex flex-col gap-2 text-sm font-medium">
              サーバーURL
              <input
                type="url"
                name="server"
                placeholder="https://example.com"
                autocomplete="url"
                class={`${inputClass} font-mono`}
              />
            </label>

            <label class="flex flex-col gap-2 text-sm font-medium">
              ID
              <input
                type="text"
                name="id"
                autocomplete="username"
                class={inputClass}
              />
            </label>

            <label class="flex min-h-11 items-center gap-2.5 text-[13px] text-muted">
              <input type="checkbox" name="remember" class="size-[18px] accent-accent" />
              この端末に接続先を記憶する
            </label>

            <button
              type="submit"
              class="h-[50px] w-full rounded-[10px] bg-btn text-base font-medium text-btn-content hover:opacity-85"
            >
              ログイン
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
