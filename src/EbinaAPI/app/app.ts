import { deleteEbina, getEbina, postEbina } from "..";

// アプリ作成
export const createApp = (token: string, name: string) =>
  postEbina(`/app/${name}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// アプリ一覧
export const getAppNames = (token: string) =>
  getEbina("/app", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// アプリ削除
export const deleteApp = (token: string, name: string) =>
  deleteEbina(`/app/${name}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });
