import { LinkButton } from "../components/ui";

export default function Top() {
  return (
    <div class="flex flex-col items-center gap-8 px-[clamp(16px,5vw,64px)] pt-16 pb-24 text-center">
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
        <LinkButton href="/login">ログイン</LinkButton>
    </div>
  );
}
