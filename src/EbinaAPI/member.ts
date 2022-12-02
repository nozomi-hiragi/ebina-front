import { startRegistration } from "@simplewebauthn/browser";
import { getEbina, postEbina, postEbinaWithWA } from ".";

// 仮メンバー登録用
export const requestTempMember = (
  token: string,
  params: { server: string; front: string; id: string; name: string },
) =>
  postEbina("/member/regist/request", token, JSON.stringify(params))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }).then((json) => json as { token: string; url?: string });

// 仮メンバー登録
export const registTempMember = (
  server: string,
  params: { token: string; name: string; id: string; pass: string },
) =>
  fetch(`${server}/ebina/member/regist/option`, {
    method: "POST",
    body: JSON.stringify(params),
  }).then(async (res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((options) => startRegistration(options)).then((result) =>
    fetch(`${server}/ebina/member/regist/verify`, {
      method: "POST",
      body: JSON.stringify({ id: params.id, result }),
    })
  ).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
  });

// 仮メンバー承認
export const admitTempMember = (token: string, ids: string[]) =>
  postEbinaWithWA("/member/temp/admit", token, JSON.stringify({ ids }))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }).then((json) => json as string[]);

// 仮メンバー否認
export const denyTempMember = async (token: string, ids: string[]) =>
  postEbinaWithWA("/member/temp/deny", token, JSON.stringify({ ids }))
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    }).then((json) => json as string[]);

// 仮メンバーら取得
export const getTempMembers = (token: string) =>
  getEbina("/member/temp", token).then(async (res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((json) => json as any[]);
