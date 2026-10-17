import { Match, Show, Switch, createResource, createSignal } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import AuthCard, { AuthCardHeader } from "../components/AuthCard";
import { Button, LinkButton } from "../components/ui";
import { ApiError, getRegisterInfo, getRegisterOptions, verifyRegister, type User } from "../api/station";
import { firstParam } from "../utils/params";
import { errorMessage } from "../auth/passkey";
import { parseCreationOptionsFromJSON, registrationResponseToJSON } from "../auth/webauthn";

const INVALID_URL = "登録用のURLが正しくありません";
const INVALID_TOKEN = "登録用のURLが無効か、期限が切れています";

export default function Register() {
  const [params] = useSearchParams();
  const server = () => firstParam(params.server) ?? "";
  const token = () => firstParam(params.token) ?? "";
  const valid = () => server() !== "" && token() !== "";

  const [info] = createResource(
    () => (valid() ? { server: server(), token: token() } : false as const),
    async (src): Promise<User> => getRegisterInfo(src.server, src.token),
  );

  const [busy, setBusy] = createSignal(false);
  const [done, setDone] = createSignal(false);
  const [error, setError] = createSignal("");
  // QR から開いた場合は確認コードが URL に入っている
  const [code, setCode] = createSignal((firstParam(params.code) ?? "").replace(/\D/g, "").slice(0, 4));
  let codeInput: HTMLInputElement | undefined;
  // 登録用トークンが無効だと分かった場合は再試行させない
  const [tokenInvalid, setTokenInvalid] = createSignal(false);

  const loadError = () => {
    const e = info.error;
    if (e instanceof ApiError && e.status === 404) return INVALID_TOKEN;
    return e instanceof Error ? e.message : "";
  };

  const handleRegister = async () => {
    setBusy(true);
    setError("");
    try {
      const optionsJSON = await getRegisterOptions(server(), token(), code());
      const publicKey = parseCreationOptionsFromJSON(optionsJSON);
      const credential = (await navigator.credentials.create({
        publicKey,
      })) as PublicKeyCredential | null;
      if (!credential) {
        throw new Error("パスキーの作成に失敗しました");
      }
      const response = registrationResponseToJSON(credential);
      await verifyRegister(server(), token(), response);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setTokenInvalid(true);
        setError(INVALID_TOKEN);
      } else {
        setError(errorMessage(err, "register"));
        if (err instanceof ApiError && err.status === 403) {
          setCode("");
          codeInput?.focus();
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const loginHref = () => `/login?server=${encodeURIComponent(server())}`;

  return (
    <div class="flex w-full justify-center px-4 pt-6 pb-16">
      <AuthCard>
        <Switch>
          <Match when={!valid()}>
            <div role="alert" class="alert alert-error alert-soft">{INVALID_URL}</div>
          </Match>
          <Match when={info.loading}>
            <p class="text-sm text-muted">読み込み中…</p>
          </Match>
          <Match when={info.error}>
            <div role="alert" class="alert alert-error alert-soft">{loadError()}</div>
          </Match>
          <Match when={done()}>
            <AuthCardHeader title="登録が完了しました" description="パスキーでログインできるようになりました。" />
            <LinkButton href={loginHref()} block>
              ログインへ
            </LinkButton>
          </Match>
          <Match when={info()}>
            {(user) => (
              <>
                <AuthCardHeader title="パスキーの登録" description="この端末にパスキーを登録します。">
                  {/* 登録先に間違いがないか確認してもらう値 */}
                  <dl class="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-2 rounded-[10px] border-2 border-accent bg-base-100 px-4 py-3 text-sm">
                    <dt class="text-muted">名前</dt>
                    <dd class="text-lg font-bold break-all text-accent">{user().name}</dd>
                    <dt class="text-muted">ID</dt>
                    <dd class="font-mono font-semibold break-all text-accent">{user().id}</dd>
                    <dt class="text-muted">サーバー</dt>
                    <dd class="font-mono font-semibold break-all text-accent">{server()}</dd>
                  </dl>
                </AuthCardHeader>
                <Show when={error()}>
                  <div role="alert" class="alert alert-error alert-soft">{error()}</div>
                </Show>
                <Show when={!tokenInvalid()}>
                  <div class="flex flex-col gap-2">
                    <label for="register-code" class="text-sm font-medium">確認コード</label>
                    <input
                      ref={codeInput}
                      id="register-code"
                      type="text"
                      inputmode="numeric"
                      autocomplete="one-time-code"
                      maxlength="4"
                      pattern="[0-9]{4}"
                      placeholder="0000"
                      class="input w-full text-center font-mono tracking-[0.5em]"
                      value={code()}
                      onInput={(e) => {
                        const v = e.currentTarget.value.replace(/\D/g, "");
                        e.currentTarget.value = v;
                        setCode(v);
                      }}
                    />
                    <p class="text-sm text-muted">サーバーの画面に表示されている4桁の数字を入力してください。</p>
                  </div>
                  <Button block disabled={busy() || !/^[0-9]{4}$/.test(code())} onClick={handleRegister}>
                    {busy() ? "登録中…" : "パスキーを登録"}
                  </Button>
                </Show>
              </>
            )}
          </Match>
        </Switch>
      </AuthCard>
    </div>
  );
}
