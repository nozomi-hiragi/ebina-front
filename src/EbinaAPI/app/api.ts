import { deleteEbina, getEbina, putEbina } from "..";
import { TypeApi } from "../../types/types";

export interface APIItemValuesV2 {
  name: string;
  path: string;
  method: "get" | "head" | "post" | "put" | "delete" | "options" | "patch";
  filename?: string;
  value: string;
}

// API起動状態取得
export const getAPIStatus = (token: string, appName: string) =>
  getEbina(`/app/${appName}/api/status`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) =>
    json as {
      status: "started" | "stop";
      started_at: number;
    }
  );

// API起動状態更新
export const updateAPIStatus = (
  token: string,
  appName: string,
  status: "start" | "stop",
) =>
  putEbina(`/app/${appName}/api/status`, token, JSON.stringify({ status }))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });

// API一覧取得
export const getAPIs = (token: string, appName: string) =>
  getEbina(`/app/${appName}/api/endpoint`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) =>
    json as (
      | { path: string; api: any }[]
      | { version: 2; apis: APIItemValuesV2[] }
    )
  );

// API取得
export const getAPI = (token: string, appName: string, path: string) =>
  getEbina(`/app/${appName}/api/endpoint/${path}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as TypeApi);

// API更新
export const updateAPI = (
  token: string,
  appName: string,
  path: string,
  api: TypeApi,
) =>
  putEbina(`/app/${appName}/api/endpoint/${path}`, token, JSON.stringify(api))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });

// API削除
export const deleteAPI = (token: string, appName: string, path: string) =>
  deleteEbina(`/app/${appName}/api/endpoint/${path}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// ポート設定
export const updatePort = (token: string, appName: string, port: number) =>
  putEbina(`/app/${appName}/api/port`, token, JSON.stringify({ port }))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });

// ポート取得
export const getPort = (token: string, appName: string) =>
  getEbina(`/app/${appName}/api/port`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json.port as number);
