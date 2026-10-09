import { A } from "@solidjs/router";
import { PageTitle } from "../components/ui";

export default function NotFound() {
  return (
    <div class="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <PageTitle>ページが見つかりません</PageTitle>
      <A href="/" class="text-accent underline underline-offset-4">
        トップへ戻る
      </A>
    </div>
  );
}
