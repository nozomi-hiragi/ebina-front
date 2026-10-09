import { buttonClass, GitHubIcon } from "./ui";

export default function GitHubLink() {
  return (
    <a
      href="https://github.com/nozomi-hiragi/ebina-station"
      target="_blank"
      rel="noopener noreferrer"
      class={buttonClass("icon")}
      aria-label="GitHub"
      title="GitHub"
    >
      <GitHubIcon />
    </a>
  );
}
