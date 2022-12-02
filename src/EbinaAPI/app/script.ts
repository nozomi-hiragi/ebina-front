import { deleteEbina, getEbina, patchEbina, postEbina } from "..";

// スクリプトファイル一覧取得
export const getScriptList = (token: string, appName: string) =>
  getEbina(`/app/${appName}/script`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// スクリプトファイル取得
export const getScript = (token: string, appName: string, path: string) =>
  getEbina(`/app/${appName}/script/${path}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  });

// スクリプトファイル作成
export const createScript = (
  token: string,
  appName: string,
  path: string,
  data: string | undefined = undefined,
) =>
  postEbina(`/app/${appName}/script/${path}`, token, data).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// スクリプトファイル更新
export const updateScript = (
  token: string,
  appName: string,
  path: string,
  data: string,
) =>
  patchEbina(`/app/${appName}/script/${path}`, token, data).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// スクリプトファイル削除
export const deleteScript = (token: string, appName: string, path: string) =>
  deleteEbina(`/app/${appName}/script/${path}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });
