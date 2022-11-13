export class LocalStorage {
  private key: string;
  constructor(key: string) {
    this.key = key;
  }
  get() {
    const obj = localStorage.getItem(this.key);
    return obj ? obj as string : undefined;
  }
  set(value: string | undefined) {
    if (value) localStorage.setItem(this.key, value as string);
    else localStorage.removeItem(this.key);
  }
}

export class ObjectLocalStorage<T extends object> {
  ls: LocalStorage;
  constructor(key: string) {
    this.ls = new LocalStorage(key);
  }
  get() {
    const obj = this.ls.get();
    return obj ? JSON.parse(obj) as T : undefined;
  }
  set(obj: T | undefined) {
    if (obj) this.ls.set(JSON.stringify(obj));
    else this.ls.set(undefined);
  }
}
