import { atom, DefaultValue, selector } from "recoil";
import EbinaAPI from "../EbinaAPI";

const membersState = atom<any[] | null>({ key: "members", default: null });
const membersFetchState = atom({ key: "membersFetch", default: 0 });
export const getMembers = selector({
  key: "getMembers",
  get: ({ get }) => {
    const members = get(membersState);
    const membersFetch = get(membersFetchState);
    if (members && (membersFetch < 0)) return members;
    return EbinaAPI.getUsers().then((ret) => ret as any[]);
  },
  set: ({ set, get }, newValue) => {
    if (newValue instanceof DefaultValue) {
      set(membersFetchState, get(membersFetchState) + 1);
      set(membersState, null);
    } else {
      set(membersFetchState, -1);
      set(membersState, newValue);
    }
  },
});
