import { For, Show, createSignal } from "solid-js";
import { addSavedServer, normalizeServer, removeSavedServer, savedServers } from "../../session";
import { BookmarkIcon, TrashIcon } from "../ui";

// 接続先の入力方法。"select" は保存済みサーバーから選ぶ、"input" は URL を直接入力する
type ServerMode = "select" | "input";

// 接続先の選択まわりの状態とハンドラ。Login 側は server() と save() を使い、<Field /> を描画する
export function createServerSelection(initialServer: string) {
  const [saved, setSaved] = createSignal(savedServers());
  // 初期接続先が保存済みなら選択、未保存なら URL 入力。無指定は保存済みがあれば選択
  const [mode, setModeSignal] = createSignal<ServerMode>(
    initialServer
      ? saved().includes(initialServer)
        ? "select"
        : "input"
      : saved().length > 0
        ? "select"
        : "input",
  );
  const [selected, setSelected] = createSignal(
    initialServer && saved().includes(initialServer) ? initialServer : (saved()[0] ?? ""),
  );
  const [newUrl, setNewUrl] = createSignal(initialServer && !saved().includes(initialServer) ? initialServer : "");
  const [remember, setRemember] = createSignal(true);

  let urlInput: HTMLInputElement | undefined;

  // 切り替え直後に Show で入力欄が描画されるので、そのままフォーカスできる
  const setMode = (m: ServerMode) => {
    setModeSignal(m);
    if (m === "input") urlInput?.focus();
  };

  const remove = () => {
    removeSavedServer(selected());
    const list = savedServers();
    setSaved(list);
    setSelected(list[0] ?? "");
    if (list.length === 0) {
      setModeSignal("input");
      urlInput?.focus();
    }
  };

  const server = () => (mode() === "select" ? selected() : normalizeServer(newUrl()));

  // ログイン成功時に呼ぶ。選択中、または記憶ONなら保存する
  const save = () => {
    if (mode() === "select" || remember()) addSavedServer(server());
  };

  const Field = () => (
    <>
      <Show when={saved().length > 0}>
        <label class="flex min-h-11 w-fit cursor-pointer items-center gap-2 text-[13px] text-muted">
          <span>入力</span>
          <input
            type="checkbox"
            class="toggle toggle-sm toggle-accent"
            checked={mode() === "select"}
            onChange={(e) => setMode(e.currentTarget.checked ? "select" : "input")}
            aria-label="保存したサーバーから選ぶ"
          />
          <span>選択</span>
        </label>
      </Show>
      <Show when={mode() === "select"}>
        <div class="join w-full">
          <select
            id="server"
            name="server-select"
            class="select join-item min-w-0 flex-1 font-mono"
            onChange={(e) => setSelected(e.currentTarget.value)}
          >
            <For each={saved()}>
              {(v) => (
                <option value={v} selected={selected() === v}>
                  {v}
                </option>
              )}
            </For>
          </select>
          <button
            type="button"
            class={`${joinIconButton} text-base-content hover:text-error`}
            aria-label="一覧から削除"
            title="一覧から削除"
            onClick={remove}
          >
            <TrashIcon />
          </button>
        </div>
      </Show>
      <Show when={mode() === "input"}>
        <div class="join w-full">
          <input
            id="server"
            type="url"
            name="server"
            class="input join-item min-w-0 flex-1 font-mono"
            ref={(el) => (urlInput = el)}
            placeholder="https://example.com"
            autocomplete="url"
            value={newUrl()}
            onInput={(e) => setNewUrl(e.currentTarget.value)}
          />
          <button
            type="button"
            aria-pressed={remember()}
            aria-label="この端末に接続先を記憶する"
            title={remember() ? "ログイン後にこの接続先を記憶します" : "記憶しません"}
            class={joinIconButton}
            classList={{ "text-accent": remember(), "text-muted": !remember() }}
            onClick={() => setRemember(!remember())}
          >
            <BookmarkIcon active={remember()} />
          </button>
        </div>
      </Show>
    </>
  );

  return { server, save, Field };
}

// select 欄の右に並ぶ、join 内のアイコンボタン共通のクラス
const joinIconButton = "btn btn-square join-item border-field bg-base-100 hover:bg-base-200";
