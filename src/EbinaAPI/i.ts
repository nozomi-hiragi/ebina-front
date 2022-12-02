import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import EbinaAPI, {
  deleteEbina,
  getEbina,
  lsServer,
  postEbina,
  putEbinaWithWA,
} from ".";
import { Member } from "../recoil/user";

// ログイン用オプション取得
export const getLoginOptions = (id?: string) =>
  fetch(`${lsServer.get()}/ebina/i/login/option`, {
    method: "POST",
    body: JSON.stringify({ id }),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) =>
    json as
      | { type: "WebAuthn"; options: any; sessionId: string }
      | { type: "Password" }
  );

// パスワードログイン
export const loginWithPassword = (id: string, pass: string) =>
  fetch(`${lsServer.get()}/ebina/i/login`, {
    method: "POST",
    body: JSON.stringify({ type: "password", id, pass }),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  }).then((token) => {
    EbinaAPI.setToken(token); // @TODO
    return token;
  });

// WebAuthnでログイン
export const loginWithWAOption = (result: any, sessionId: string) =>
  fetch(`${lsServer.get()}/ebina/i/login/verify`, {
    method: "POST",
    body: JSON.stringify({ result, sessionId }),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  }).then((token) => {
    EbinaAPI.setToken(token); // @TODO
    return token;
  });

// ログアウト
export const logout = (token: string) =>
  postEbina("/i/logout", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    EbinaAPI.setToken(undefined); // @TODO
  });

// 自分取得
export const getMe = (token: string) =>
  getEbina("/i", token).then(async (res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as Member);

// WebAuthnデバイス登録
export const registWebAuthnDevice = (token: string, deviceName: string) =>
  getEbina(`/i/webauthn/regist?deviceName=${deviceName}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((options) => startRegistration(options)).then((result) =>
    postEbina("/i/webauthn/regist", token, JSON.stringify(result))
  ).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// WebAuthn認証確認
export const checkWebAuthnVerify = (token: string, deviceNames?: string[]) =>
  getEbina(
    `/i/webauthn/verify?deviceNames=${deviceNames?.join(",")}`,
    token,
  ).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((options) => startAuthentication(options)).then((result) =>
    postEbina("/i/webauthn/verify", token, JSON.stringify(result))
  ).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// WebAuthnデバイス名取得
export const getWebAuthnDeviceNames = (token: string) =>
  getEbina("/i/webauthn/device", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// ログイン用WebAuthnデバイス確認
export const checkEnableWebAuthnDevice = (token: string, deviceName: string) =>
  getEbina(`/i/webauthn/device/${deviceName}/enable`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as boolean);

// ログイン用WebAuthnデバイス有効
export const enableWebAuthnDevice = (token: string, deviceName: string) =>
  postEbina(`/i/webauthn/device/${deviceName}/enable`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// ログイン用WebAuthnデバイス無効
export const disableWebAuthnDevice = (token: string, deviceName: string) =>
  postEbina(`/i/webauthn/device/${deviceName}/disable`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// WebAuthnデバイス削除
export const deleteWebAuthnDevice = (token: string, deviceName: string) =>
  deleteEbina(`/i/webauthn/device/${deviceName}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// パスワード更新
export const updatePassword = (
  token: string,
  value: { current: string; new: string },
) =>
  putEbinaWithWA("/i/password", token, JSON.stringify(value)).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// WebPushデバイス登録
export const registWebPushDevice = (
  token: string,
  value: { deviceName: string; subscription: PushSubscriptionJSON },
) =>
  postEbina("/i/webpush/device", token, JSON.stringify(value)).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.status === 201; // isNew
  });

// WebPushに登録済みか確認
export const checkSubscribedWebPushDevice = (
  token: string,
  deviceName: string,
) =>
  getEbina(`/i/webpush/subscribed/${deviceName}`, token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) =>
    json as { subscribed: boolean; applicationServerKey?: string }
  );

// WebPushデバイス名ら取得
export const getWebPushDeviceNames = (token: string) =>
  getEbina("/i/webpush/devices/", token).then(async (res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);

// WebPush動作確認用テスト通知送信
export const postWebPushTest = (token: string, deviceName: string) =>
  postEbina(`/i/webpush/test`, token, JSON.stringify({ deviceName }));

// WebPushデバイス削除
export const deleteWebPushDevice = (token: string, name: string) =>
  deleteEbina(`/i/webpush/device/${name}`, token).then(async (res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as string[]);
