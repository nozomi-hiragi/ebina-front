import { Show, createEffect, on, onCleanup, type ParentProps } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { getMe } from "../api";
import { clearSession, reloadSession, saveSession, session } from "../session";
import { isReauthError, wakeClient, wakeStore } from "../wake";

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

  return <Show when={session()}><div class="min-h-dvh">{props.children}</div></Show>;
}
