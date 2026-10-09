import type { ParentProps } from "solid-js";

export default function PageTitle(props: ParentProps) {
  return <h1 class="text-2xl font-bold">{props.children}</h1>;
}
