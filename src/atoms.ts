import { atom, selector } from "recoil";
import EbinaAPI from "./EbinaAPI";

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
