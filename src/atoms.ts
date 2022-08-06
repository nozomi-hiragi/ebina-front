import { atom, DefaultValue, selector } from "recoil";
import EbinaAPI from "./EbinaAPI";
import * as LS from "./localstorageDelegate";

export type User = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  iat: number;
  exp: number;
} | null;

const userState = atom<User>({ key: "user", default: null });

export const userSelector = selector<User>({
  key: "userSelector",
  get: ({ get }) => get(userState),
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      set(userState, null);
      return;
    }
    if (newValue && newValue.exp < Math.floor(Date.now() / 1000)) {
      LS.remove(LS.ITEM.User);
    } else LS.set(LS.ITEM.User, JSON.stringify(newValue));
    set(userState, newValue);
  },
});

const appNameListState = atom<string[]>({ key: "appNameList", default: [] });
export const appNameListSelector = selector<string[]>({
  key: "appNameListSelector",
  get: async ({ get }) => {
    const appNameList = get(appNameListState);
    if (appNameList.length !== 0) return appNameList;
    return await EbinaAPI.getAppNames().then((res) => res).catch((err) => {
      console.error(err);
      return [];
    });
  },
  set: ({ set }, newValue) => {
    set(appNameListState, newValue);
  },
});
