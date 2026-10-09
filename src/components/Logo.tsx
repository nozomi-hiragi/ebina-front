import { LogoMark } from "./ui";

export default function Logo() {
  return (
    <span class="inline-flex items-center gap-2.5">
      <span class="grid size-[30px] place-items-center rounded-[9px] bg-primary">
        <LogoMark />
      </span>
      <span class="text-[18px] font-bold tracking-[0.02em] text-base-content">EbinaStation</span>
    </span>
  );
}
