import { deleteEbina, getEbina, postEbina, putEbina } from "..";

interface ProcessItem {
  filename: string;
  function: string;
}

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

// init取得
export const getInit = (token: string, name: string) =>
  getEbina(`/app/${name}/init`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json().catch(() => undefined);
  }).then((json) => json as ProcessItem | undefined);

// init設定
export const putInit = (token: string, name: string, vales: ProcessItem) =>
  putEbina(`/app/${name}/init`, token, JSON.stringify(vales))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });

// final取得
export const getFinal = (token: string, name: string) =>
  getEbina(`/app/${name}/final`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json().catch(() => undefined);
  }).then((json) => json as ProcessItem | undefined);

// final設定
export const putFinal = (token: string, name: string, vales: ProcessItem) =>
  putEbina(`/app/${name}/final`, token, JSON.stringify(vales))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });
