import { startAuthentication } from "@simplewebauthn/browser";
import { UnauthorizedError } from "../components/UnauthorizedErrorBoundary";
import { LocalStorage } from "../localstorage";

export const lsServer = new LocalStorage("server");
export const newEbinaURL = (path: string) =>
  new URL(`${lsServer.get()}/ebina${path}`);

export const fetchWithToken = (
  url: URL,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  token: string,
  body?: BodyInit | null,
) =>
  fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body,
  }).then((res) => {
    if (res.status === 401) throw new UnauthorizedError();
    return res;
  });

export const getEbina = (
  path: string,
  token: string,
) => fetchWithToken(newEbinaURL(path), "GET", token);

export const postEbina = (
  path: string,
  token: string,
  body?: BodyInit | null,
) => fetchWithToken(newEbinaURL(path), "POST", token, body);

export const putEbina = (
  path: string,
  token: string,
  body?: BodyInit | null,
) => fetchWithToken(newEbinaURL(path), "PUT", token, body);

export const patchEbina = (
  path: string,
  token: string,
  body?: BodyInit | null,
) => fetchWithToken(newEbinaURL(path), "PATCH", token, body);

export const deleteEbina = (
  path: string,
  token: string,
) => fetchWithToken(newEbinaURL(path), "DELETE", token);

export const postEbinaWithWA = (
  path: string,
  token: string,
  body?: BodyInit | null,
) =>
  postEbina(path, token, body).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((options) => startAuthentication(options)).then((result) =>
    postEbina(path, token, JSON.stringify(result))
  );

export const putEbinaWithWA = (
  path: string,
  token: string,
  body?: BodyInit | null,
) =>
  putEbina(path, token, body).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }).then((options) => startAuthentication(options)).then((result) =>
    putEbina(path, token, JSON.stringify(result))
  );
