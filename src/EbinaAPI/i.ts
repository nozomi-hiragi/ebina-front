import { startRegistration } from "@simplewebauthn/browser";
import {
  deleteEbina,
  getEbina,
  newEbinaURL,
  postEbina,
  postEbinaWithWA,
  putEbinaWithWA,
} from ".";
import { Member } from "../recoil/user";

// ログイン用オプション取得
export const getLoginOptions = (id?: string) =>
  fetch(newEbinaURL("/i/login/option"), {
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
  fetch(newEbinaURL("/i/login"), {
    method: "POST",
    body: JSON.stringify({ type: "password", id, pass }),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  }).then((token) => token);

// WebAuthnでログイン
export const loginWithWAOption = (result: any, sessionId: string) =>
  fetch(newEbinaURL("/i/login/verify"), {
    method: "POST",
    body: JSON.stringify({ result, sessionId }),
  }).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  }).then((token) => token);

// ログアウト
export const logout = (token: string) =>
  postEbina("/i/logout", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// 自分取得
export const getMe = (token: string) =>
  getEbina("/i", token).then(async (res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as Member);

// WebAuthnデバイス登録
export const registWebAuthnDevice = async (
  token: string,
  values: { deviceName: string; pass: string; code: string },
) =>
  await postEbina("/i/webauthn/regist", token, JSON.stringify(values))
    .then((res) => {
      if (res.ok) return res.json();
      switch (res.status) {
        case 403:
          throw new Error("Auth failed");
        case 405:
          throw new Error("Auth feature was not implemented");
        default:
          throw new Error(res.statusText);
      }
    }).then((options) => startRegistration(options)).then((result) =>
      postEbina("/i/webauthn/regist", token, JSON.stringify(result))
    ).then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }).then((json) => json as string[]);

// WebAuthn認証確認
export const checkWebAuthnVerify = (token: string, deviceNames?: string[]) =>
  postEbinaWithWA("/i/webauthn/verify", token, JSON.stringify({ deviceNames }))
    .then((res) => {
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
export const deleteWebAuthnDevice = async (
  token: string,
  deviceName: string,
  type: "WebAuthn" | "Password",
  props?: { pass: string; code: string },
) => {
  const promise = type === "WebAuthn"
    ? postEbinaWithWA(`/i/webauthn/device/${deviceName}/delete`, token)
    : postEbina(
      `/i/webauthn/device/${deviceName}/delete`,
      token,
      JSON.stringify({ type: "password", ...props }),
    );
  return await promise.then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });
};

// パスワード更新
export const updatePassword = (
  token: string,
  value: { current: string; new: string },
) =>
  putEbinaWithWA("/i/password", token, JSON.stringify(value)).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// TOTP登録要求
export const requestTOTP = (token: string) =>
  postEbina("/i/totp/request", token).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  });

// TOTP登録
export const updateTOTP = (token: string, pass: string, code: string) =>
  postEbinaWithWA("/i/totp/regist", token, JSON.stringify({ pass, code }))
    .then((res) => {
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
