import { A } from "@solidjs/router";
import Logo from "./Logo";
import GitHubLink from "./GitHubLink";
import ThemeToggle from "./ThemeToggle";

export default function PublicHeader() {
  return (
    <header class="flex items-center justify-between px-[clamp(16px,5vw,64px)] py-6">
      <A href="/" class="rounded-[9px]" aria-label="EbinaStation トップへ">
        <Logo />
      </A>
      <div class="flex items-center gap-2">
        <GitHubLink />
        <ThemeToggle />
      </div>
    </header>
  );
}
