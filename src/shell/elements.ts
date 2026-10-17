class ShellHeader extends HTMLElement {
  static observedAttributes = ["title"];
  private heading: HTMLElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>
      :host { display: block; color: var(--color-base-content); background: var(--color-base-100); }
      header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--color-base-300); padding: .75rem 1rem; }
      h1 { margin: 0; font: inherit; font-weight: 700; overflow-wrap: anywhere; }
      button { display: grid; place-items: center; flex-shrink: 0; min-width: 44px; min-height: 44px; border: 0; border-radius: 10px; background: var(--color-base-200); color: inherit; cursor: pointer; }
      button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
      svg { width: 22px; height: 22px; }
    </style><header><h1></h1><button type="button" aria-label="設定"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3z"/><circle cx="12" cy="12" r="3"/></svg></button></header>`;
    this.heading = root.querySelector("h1")!;
    root.querySelector("button")!.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("sh-navigate", { detail: { path: "/settings" }, bubbles: true, composed: true }));
    });
  }

  connectedCallback() { this.updateTitle(); }
  attributeChangedCallback() { this.updateTitle(); }
  private updateTitle() { this.heading.textContent = this.getAttribute("title") ?? "ホーム"; }
}

export function registerShellElements() {
  if (!customElements.get("sh-header")) customElements.define("sh-header", ShellHeader);
}
