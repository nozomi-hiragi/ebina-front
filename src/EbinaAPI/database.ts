import { deleteEbina, getEbina, postEbina } from ".";

// ユーザー作成
export const createMongoDBUser = (token: string, user: {
  username: string;
  password: string;
  roles: { role: string; db: string }[];
}) =>
  postEbina("/database/user", token, JSON.stringify(user)).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json);

// ユーザー一覧
export const getDBUsers = (token: string) =>
  getEbina("/database/user", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) =>
    json as {
      user: string;
      roles: { role: string; db: string }[];
    }[]
  );

// ユーザー削除
export const deleteMongoDBUser = (token: string, username: string) =>
  deleteEbina(`/database/user/${username}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });

// DB一覧
export const getDatabases = (token: string) =>
  getEbina("/database", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) =>
    json as {
      name: string;
      sizeOnDisk?: number;
      empty?: false;
    }[]
  );

// Collection一覧
export const getCollections = (token: string, dbName: string) =>
  getEbina(`/database/${dbName}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// Document一覧
export const getDocments = (token: string, dbName: string, colName: string) =>
  getEbina(`/database/${dbName}/${colName}/find`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as any[]);
