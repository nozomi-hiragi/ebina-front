import { Show, type JSX, type ParentProps } from "solid-js";

export function AuthCardHeader(props: ParentProps<{ title: JSX.Element; description?: JSX.Element }>) {
  return (
    <div class="flex flex-col gap-3">
      <h1 class="text-[26px] font-bold">{props.title}</h1>
      {props.children}
      <Show when={props.description}>
        <p class="text-sm leading-[1.7] text-muted">{props.description}</p>
      </Show>
    </div>
  );
}

export default function AuthCard(props: ParentProps) {
  return (
    <section class="flex w-full max-w-[420px] flex-col gap-7 rounded-[16px] border border-t-4 border-base-300 border-t-marker bg-base-200 px-[clamp(20px,5vw,36px)] py-9">
      {props.children}
    </section>
  );
}
