import { Show, createSignal, onMount } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { startAuthentication, type AuthenticationResponseJSON } from "@simplewebauthn/browser";
import AuthCard, { AuthCardHeader } from "../components/AuthCard";
import { createServerSelection } from "../components/login/serverSelection";
import { Button } from "../components/ui";
import { ApiError, getLoginOptions, verifyLogin } from "../api";
import { firstParam } from "../params";
import { errorMessage } from "../passkey";
import { createPasskeyAutofill } from "../passkeyAutofill";
import { normalizeServer, saveSession, session } from "../session";

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

  // ボタンとオートフィルで共通の、認証レスポンス検証からの成功処理
  const finishLogin = async (s: string, sessionId: string, response: AuthenticationResponseJSON) => {
    const result = await verifyLogin(s, sessionId, response);
    saveSession({ server: s, token: result.token, user: result.user });
    servers.save();
    navigate("/dashboard", { replace: true });
  };

  // 接続先が決まっている間、ID 欄でパスキーのオートフィルを待つ
  createPasskeyAutofill({
    server: servers.server,
    retry,
    onCredential: async (s, sessionId, response) => {
      setBusy(true);
      try {
        await finishLogin(s, sessionId, response);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        setBusy(false);
      }
    },
  });

  onMount(() => {
    // ログイン済みでクエリ無しならダッシュボードへ
    if (session() && !params.server && !params.id) {
      navigate("/dashboard", { replace: true });
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
    setBusy(true);
    setError("");
    try {
      const { sessionId, options } = await getLoginOptions(s, u);
      const response = await startAuthentication({ optionsJSON: options });
      await finishLogin(s, sessionId, response);
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
