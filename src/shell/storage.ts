// localStorage の読み書き。使えない環境（プライベートモードなど）では読めなければ null、書けなければ何もしない
export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable
  }
}
