import { Show, createSignal, onMount } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import AuthCard, { AuthCardHeader } from "../components/AuthCard";
import { createServerSelection } from "../components/login/serverSelection";
import { Button } from "../components/ui";
import { getMe } from "../api/station";
import { firstParam } from "../utils/params";
import { errorMessage } from "../auth/passkey";
import { createPasskeyAutofill } from "../auth/passkeyAutofill";
import { normalizeServer, saveSession, session } from "../auth/session";
import { wakeClient } from "../auth/wake";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const queryServer = normalizeServer(firstParam(params.server) ?? "");
  const queryId = firstParam(params.id);
  const servers = createServerSelection(queryServer);
  const [id, setId] = createSignal(queryId ?? "");
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal("");
  // ボタンでのログインに失敗したらオートフィルを張り直すためのカウンター
  const [retry, setRetry] = createSignal(0);

  let idInput: HTMLInputElement | undefined;

  // ボタンとオートフィルで共通のログイン完了処理
  const finishLogin = async (s: string) => {
    const user = await getMe(s);
    saveSession({ server: s, user });
    servers.save();
    navigate("/", { replace: true });
  };

  // 接続先が決まっている間、ID 欄でパスキーのオートフィルを待つ
  const autofill = createPasskeyAutofill({
    server: servers.server,
    retry,
    onSuccess: async (s) => {
      setBusy(true);
      try {
        await finishLogin(s);
      } catch (err) {
        setError(errorMessage(err, "login"));
        setBusy(false);
        setRetry((n) => n + 1);
      }
    },
    onError: (err) => {
      setError(errorMessage(err, "login"));
      setRetry((n) => n + 1);
    },
  });

  onMount(() => {
    // ログイン済みでクエリ無しならホームへ
    if (session() && !params.server && !params.id) {
      navigate("/", { replace: true });
      return;
    }
    if (queryId) idInput?.focus();
  });

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const s = servers.server();
    const u = id().trim();
    if (!s) {
      setError("サーバーURLを入力してください");
      return;
    }

    // 先にオートフィルの待機を中断する
    setBusy(true);
    await autofill.abort();
    setError("");

    try {
      const client = wakeClient(s);
      const mode = u ? { mode: "username" as const, username: u } : { mode: "discoverable" as const };
      await client.login(mode);
      await finishLogin(s);
    } catch (err) {
      setError(errorMessage(err, "login"));
      setBusy(false);
      setRetry((n) => n + 1);
    }
  };

  return (
    <div class="flex w-full justify-center px-4 pt-6 pb-16">
      <AuthCard>
        <AuthCardHeader title="Login" />

        <form class="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div class="flex flex-col gap-2">
            <label for="server" class="text-sm font-medium">
              URL
            </label>
            <servers.Field />
          </div>

          <div class="flex flex-col gap-2">
            <label for="login-id" class="text-sm font-medium">
              ID
            </label>
            <input
              id="login-id"
              type="text"
              class="input w-full"
              name="username"
              ref={(el) => (idInput = el)}
              autocomplete="username webauthn"
              placeholder="IDを入力、または候補からパスキーを選択"
              value={id()}
              onInput={(e) => setId(e.currentTarget.value)}
            />
          </div>

          <Show when={error()}>
            <div role="alert" class="alert alert-error alert-soft">{error()}</div>
          </Show>

          <Button type="submit" block disabled={busy() || !id().trim()}>
            {busy() ? "接続中…" : "ログイン"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
