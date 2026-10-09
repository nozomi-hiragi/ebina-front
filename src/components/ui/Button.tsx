import { A } from "@solidjs/router";
import { splitProps, type ComponentProps, type JSX } from "solid-js";

export type ButtonVariant = "primary" | "icon";

const base = {
  // block: 幅いっぱい（btn-block）/ それ以外はコンテンツ幅
  primary: "btn [--btn-color:var(--ebina-btn-bg)] [--btn-fg:var(--ebina-btn-fg)] px-7 text-base",
  icon: "btn btn-square btn-ghost size-11 border-base-300 hover:bg-base-200",
} satisfies Record<ButtonVariant, string>;

type ClassOptions = { block?: boolean; class?: string };

// ボタン以外の要素（label, 外部リンクなど）にも同じ見た目を当てるためのヘルパー
export function buttonClass(variant: ButtonVariant, options: ClassOptions = {}) {
  return [base[variant], variant === "primary" && options.block && "btn-block", options.class].filter(Boolean).join(" ");
}

type CommonProps = { variant?: ButtonVariant; block?: boolean };

export function Button(props: CommonProps & JSX.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [local, rest] = splitProps(props, ["variant", "block", "class"]);
  return (
    <button
      type="button"
      {...rest}
      class={buttonClass(local.variant ?? "primary", { block: local.block, class: local.class })}
    />
  );
}

export function LinkButton(props: CommonProps & ComponentProps<typeof A>) {
  const [local, rest] = splitProps(props, ["variant", "block", "class"]);
  return <A {...rest} class={buttonClass(local.variant ?? "primary", { block: local.block, class: local.class })} />;
}
