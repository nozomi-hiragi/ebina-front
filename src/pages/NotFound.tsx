import { A } from "@solidjs/router";

export default function NotFound() {
  return (
    <div class="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 class="text-2xl font-bold">ページが見つかりません</h1>
      <A href="/" class="text-accent underline underline-offset-4">
        トップへ戻る
      </A>
    </div>
  );
}
