import { A } from "@solidjs/router";
import PublicHeader from "../components/PublicHeader";

export default function Top() {
  return (
    <div class="flex min-h-dvh flex-col">
      <PublicHeader />
      <main class="flex flex-1 flex-col items-center justify-center gap-8 px-[clamp(16px,5vw,64px)] pt-16 pb-24 text-center">
        <h1 class="text-[clamp(36px,5vw,56px)] leading-[1.25] font-bold tracking-[-0.01em]">
          ようこそ、
          <mark
            class="bg-transparent px-0 text-inherit"
            style="background: linear-gradient(transparent 62%, var(--ebina-marker) 62%)"
          >
            EbinaStation
          </mark>
          {" "}へ
        </h1>
        <A
          href="/login"
          class="inline-flex min-h-12 items-center rounded-[10px] bg-btn px-7 text-base font-medium text-btn-content hover:opacity-85"
        >
          ログイン
        </A>
      </main>
    </div>
  );
}
