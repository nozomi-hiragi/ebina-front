export interface PlayerSettings {
  theme?: { options: { value: string; label: string }[]; get(): string; set(value: string): void };
  connection?: { server: string; user: { id: string; name: string } };
  versions?: Record<string, string>;
  logout?: () => Promise<void> | void;
}

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(label: string, action: () => void) {
  const node = element("button", label);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

export function baseView(root: ShadowRoot, title: string) {
  const style = element("style");
  style.textContent = `
    :host { display:block; color:var(--color-base-content); background:var(--color-base-100); font-family:inherit; }
    * { box-sizing:border-box; }
    main { max-width:48rem; margin:auto; padding:1rem; display:grid; gap:1rem; overflow-wrap:anywhere; }
    h1,h2,p { margin:0; } h1 { font-size:1.5rem; } h2 { font-size:1.1rem; }
    section { display:grid; gap:.75rem; padding:1rem; border-radius:var(--radius-box); background:var(--color-base-200); min-width:0; }
    .choices { display:flex; flex-wrap:wrap; gap:.5rem; }
    button { min-height:44px; min-width:44px; padding:.5rem 1rem; font:inherit; white-space:normal; overflow-wrap:anywhere; border:1px solid var(--color-base-300); border-radius:var(--radius-field); color:var(--color-base-content); background:var(--color-base-100); cursor:pointer; }
    button[aria-pressed="true"] { background:var(--color-primary); color:var(--color-primary-content); }
    button:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
    button:disabled { opacity:.6; cursor:wait; }
  `;
  const main = element("main");
  main.append(element("h1", title));
  root.replaceChildren(style, main);
  document.title = title;
  return main;
}

export function renderSettings(root: ShadowRoot, settings: PlayerSettings, apps: { title: string; path: string }[], navigate: (path: string) => void, onError: (error: unknown) => void) {
  const main = baseView(root, "設定");
  const section = (title: string) => {
    const node = element("section");
    node.append(element("h2", title));
    main.append(node);
    return node;
  };
  if (settings.theme) {
    const theme = settings.theme;
    const choices = element("div");
    choices.className = "choices";
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "テーマ");
    const buttons = theme.options.map(option => {
      const node = button(option.label, () => {
        try { theme.set(option.value); update(); } catch (error) { onError(error); }
      });
      return { node, value: option.value };
    });
    const update = () => buttons.forEach(({ node, value }) => node.setAttribute("aria-pressed", String(theme.get() === value)));
    update();
    choices.append(...buttons.map(item => item.node));
    section("テーマ").append(choices);
  }
  if (settings.connection) {
    section("接続先").append(element("p", settings.connection.server));
    section("ユーザー").append(element("p", settings.connection.user.name), element("p", settings.connection.user.id));
  }
  if (settings.versions) {
    const node = section("バージョン");
    for (const [name, version] of Object.entries(settings.versions)) node.append(element("p", `${name}: ${version}`));
  }
  if (settings.logout) {
    const logout = settings.logout;
    const node = button("ログアウト", () => {
      node.disabled = true;
      node.textContent = "ログアウト中…";
      void Promise.resolve().then(logout).catch(onError).finally(() => {
        node.disabled = false;
        node.textContent = "ログアウト";
      });
    });
    main.append(node);
  }
  if (apps.length) {
    const node = section("アプリ");
    for (const app of apps) node.append(button(app.title, () => navigate(app.path)));
  }
}
