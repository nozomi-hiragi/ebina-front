import { atom, DefaultValue, selector } from "recoil";
import {
  getMembers as getMembersAPI,
  getTempMembers as getTempMembersAPI,
} from "../EbinaAPI/member";
import { tokenSelector } from "./user";

const membersState = atom<any[] | null>({ key: "members", default: null });
const membersFetchState = atom({ key: "membersFetch", default: 0 });
export const getMembers = selector({
  key: "getMembers",
  get: ({ get }) => {
    const members = get(membersState);
    const membersFetch = get(membersFetchState);
    if (members && (membersFetch < 0)) return members;
    return getMembersAPI(get(tokenSelector));
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

const tempMembersState = atom<any[] | null>({
  key: "tempmembers",
  default: null,
});
const tempMembersFetchState = atom({ key: "tempmembersFetch", default: 0 });
export const getTempMembers = selector({
  key: "getTempMembers",
  get: ({ get }) => {
    const tempMembers = get(tempMembersState);
    const tempMembersFetch = get(tempMembersFetchState);
    if (tempMembers && (tempMembersFetch < 0)) return tempMembers;
    return getTempMembersAPI(get(tokenSelector)).catch(() => null);
  },
  set: ({ set, get }, newValue) => {
    if (newValue instanceof DefaultValue) {
      set(tempMembersFetchState, get(tempMembersFetchState) + 1);
      set(tempMembersState, null);
    } else {
      set(tempMembersFetchState, -1);
      set(tempMembersState, newValue);
    }
  },
});
