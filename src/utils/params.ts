// クエリパラメータは string | string[] で来るので先頭の 1 つを取る
export function firstParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}
