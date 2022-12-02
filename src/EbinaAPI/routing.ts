import { deleteEbina, getEbina, postEbina, putEbina } from ".";

export type NginxConf = {
  hostname: string;
  port: number | "koujou";
  www?: boolean;
};

// ルーター状態
export const getRoutingStatus = (token: string) =>
  getEbina("/routing/status", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  });

// ルーター状態変更
export const updateRouter = (token: string, status: string) =>
  putEbina("/routing/status", token, JSON.stringify({ status }))
    .then((res) => res.ok);

// ルート一覧
export const getRouteList = (token: string) =>
  getEbina("/routing", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// ルート作成
export const newRoute = (token: string, name: string, conf: NginxConf) =>
  postEbina(`/routing/route/${name}`, token, JSON.stringify(conf))
    .then((res) => {
      if (res.status === 409) return false;
      if (!res.ok) throw new Error(res.statusText);
      return true;
    });

// ルート詳細
export const getRoute = (token: string, name: string) =>
  getEbina(`/routing/route/${name}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as NginxConf);

// ルート設定
export const setRoute = (token: string, name: string, conf: NginxConf) =>
  putEbina(`/routing/route/${name}`, token, JSON.stringify(conf))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.status === 201;
    });

// ルート削除
export const deleteRoute = (token: string, name: string): Promise<boolean> =>
  deleteEbina(`/routing/route/${name}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return true;
  });
