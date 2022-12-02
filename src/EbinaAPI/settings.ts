import { getEbina, postEbina } from ".";

export type WebAuthnSetting = {
  rpName: string;
  rpIDType: "variable" | "static";
  rpID?: string;
  attestationType?: AttestationConveyancePreference;
};

export type MongoDBSettings = {
  port: number;
  username: "env" | string;
  password: "env" | string;
};

// WebAuthn設定取得
export const getWebAuthnSettings = (token: string) =>
  getEbina("/settings/webauthn", token).then((res) => {
    if (res.status === 503) return undefined;
    if (!res.ok) throw new Error(res.statusText);
    return res.json().then((json) => json as WebAuthnSetting);
  });

// WebAuthn設定保存
export const setWebAuthnBSettings = (
  token: string,
  settings: WebAuthnSetting,
) =>
  postEbina("/settings/webauthn", token, JSON.stringify(settings))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });

// mongodb設定取得
export const getMongoDBSettings = (token: string) =>
  getEbina("/settings/mongodb", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as MongoDBSettings);

// mongodb設定保存
export const setMongoDBSettings = (token: string, settings: MongoDBSettings) =>
  postEbina("/settings/mongodb", token, JSON.stringify(settings))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
    });
