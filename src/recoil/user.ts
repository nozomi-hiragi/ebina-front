import jwtDecode, { JwtPayload } from "jwt-decode";
import { atom, DefaultValue, selector } from "recoil";
import { getMe } from "../EbinaAPI/i";
import { ObjectLocalStorage } from "../utils/localstorage";

export type Member = {
  id: string;
  name: string;
};

type TokenPayload = {
  id: string;
} & JwtPayload;

const decodeToken = (token: string) => jwtDecode<TokenPayload>(token);

const lsPayload = new ObjectLocalStorage<TokenPayload>("payload");
const payloadState = atom<TokenPayload | undefined>({
  key: "payload",
  default: lsPayload.get(),
});
export const payloadSelector = selector<TokenPayload | undefined>({
  key: "payloadSelector",
  get: ({ get }) => get(payloadState),
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) newValue = undefined;
    lsPayload.set(newValue);
    set(payloadState, newValue);
  },
});

const tokenState = atom({ key: "token", default: "" });
export const tokenSelector = selector({
  key: "tokenSelector",
  get: ({ get }) => get(tokenState),
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) newValue = "";
    set(payloadSelector, newValue ? decodeToken(newValue) : undefined);
    set(tokenState, newValue);
  },
});

export const loggedIn = selector({
  key: "loggedIn",
  get: ({ get }) => get(payloadState) !== undefined,
});

export const getMyInfo = selector({
  key: "getMyInfo",
  get: async ({ get }) => getMe(get(tokenState)).catch(() => undefined),
});
