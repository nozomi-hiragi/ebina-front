import { ApiError } from "./api";

// WebAuthn のエラーを日本語の文言にする
function passkeyErrorMessage(err: unknown, kind: "register" | "login"): string {
  if (err instanceof DOMException || err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    if (err.name === "NotAllowedError") return "パスキーの操作がキャンセルされました";
    if (
      kind === "register" &&
      (err.name === "InvalidStateError" || code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED")
    ) {
      return "このパスキーはすでに登録されています";
    }
  }
  return "パスキーの操作に失敗しました";
}

function isCancelled(err: unknown): boolean {
  return err instanceof Error && err.name === "NotAllowedError";
}

// 画面に出すエラー文言。API のエラーはサーバーの文言をそのまま使い、
// パスキーのエラーは WebAuthn の種類に応じた文言にする（キャンセル以外は console に残す）
export function errorMessage(err: unknown, kind: "register" | "login"): string {
  if (err instanceof ApiError) return err.message;
  if (!isCancelled(err)) console.error(err);
  return passkeyErrorMessage(err, kind);
}
