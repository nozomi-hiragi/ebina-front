import { atom, selector } from "recoil";
import { getAppNames } from "./EbinaAPI/app/app";
import { tokenSelector } from "./recoil/user";

const appNameListState = atom<string[]>({ key: "appNameList", default: [] });
export const appNameListSelector = selector<string[]>({
  key: "appNameListSelector",
  get: async ({ get }) => {
    const appNameList = get(appNameListState);
    if (appNameList.length !== 0) return appNameList;
    return await getAppNames(get(tokenSelector)).then((res) => res)
      .catch((err) => {
        console.error(err);
        return [];
      });
  },
  set: ({ set }, newValue) => {
    set(appNameListState, newValue);
  },
});
