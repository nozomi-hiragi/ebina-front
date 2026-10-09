import { For } from "solid-js";

const cards = ["アプリ", "メンバー", "ステータス", "お知らせ"];

export default function Dashboard() {
  return (
    <div class="flex flex-col gap-6">
      <h1 class="text-2xl font-bold">ダッシュボード</h1>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <For each={cards}>
          {(title) => (
            <section class="flex flex-col gap-2 rounded-box bg-base-200 p-6">
              <h2 class="text-base font-bold">{title}</h2>
              <p class="text-sm text-muted">準備中</p>
            </section>
          )}
        </For>
      </div>
    </div>
  );
}
