import { deleteEbina, getEbina, patchEbina, postEbina } from "..";

export type CronItem = {
  enable: boolean;
  pattern: string;
  function: string;
};

// cron一覧
export const getCronList = (token: string, appName: string) =>
  getEbina(`/app/${appName}/cron`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// cron取得
export const getCron = (token: string, appName: string, cronName: string) =>
  getEbina(`/app/${appName}/cron/${cronName}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as CronItem);

// cron作成
export const createCron = (
  token: string,
  appName: string,
  cronName: string,
  cronItem: CronItem,
) =>
  postEbina(`/app/${appName}/cron/${cronName}`, token, JSON.stringify(cronItem))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });

// cron更新
export const updateCron = (
  token: string,
  appName: string,
  cronName: string,
  cronItem: CronItem,
) =>
  patchEbina(
    `/app/${appName}/cron/${cronName}`,
    token,
    JSON.stringify(cronItem),
  ).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// delete cron
// 200 ok
// 400 情報おかしい
// 401 認証おかしい
// 500 ファイル関係ミスった
export const deleteCron = (token: string, appName: string, cronName: string) =>
  deleteEbina(`/app/${appName}/cron/${cronName}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });
