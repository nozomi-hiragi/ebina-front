import { ApiError } from "../api/station";
import { wakeErrorCode } from "./wake";

// WAKE や WebAuthn のエラーを日本語の文言にする
function passkeyErrorMessage(err: unknown, kind: "register" | "login"): string {
  const wakeCode = wakeErrorCode(err);
  if (wakeCode) {
    if (wakeCode === "auth_failed") return "認証に失敗しました";
    if (wakeCode === "reauth") return "再度ログインしてください";
    if (wakeCode === "timeout") return "認証がタイムアウトしました";
    if (wakeCode === "cancelled") return "パスキーの操作がキャンセルされました";
    return "認証に失敗しました";
  }

  if (err instanceof DOMException || err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    if (err.name === "NotAllowedError") return "パスキーの操作がキャンセルされました";
    if (
      kind === "register" &&
      (err.name === "InvalidStateError" || code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED")
    ) {
      return "このパスキーはすでに登録されています";
    }
    if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("NetworkError"))) {
      return "サーバーに接続できませんでした";
    }
  }
  return "パスキーの操作に失敗しました";
}

function isCancelled(err: unknown): boolean {
  if (wakeErrorCode(err) === "cancelled") return true;
  return err instanceof Error && err.name === "NotAllowedError";
}

// 画面に出すエラー文言。API のエラーはサーバーの文言をそのまま使い、
// パスキーのエラーは WebAuthn / WAKE の種類に応じた文言にする（キャンセル以外は console に残す）
export function errorMessage(err: unknown, kind: "register" | "login"): string {
  if (err instanceof ApiError) return err.message;
  if (!isCancelled(err)) console.error(err);
  return passkeyErrorMessage(err, kind);
}
