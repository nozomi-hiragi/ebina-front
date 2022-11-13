export const ITEM = {
  User: "user",
  Server: "server",
} as const;
type Item = typeof ITEM[keyof typeof ITEM];

export const get = (item: Item) => localStorage.getItem(item);
export const set = (item: Item, value: string | null) =>
  value ? localStorage.setItem(item, value) : remove(item);
export const remove = (item: Item) => localStorage.removeItem(item);
