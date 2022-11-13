import { atom, DefaultValue, selector } from "recoil";
import { ObjectLocalStorage } from "../localstorage";

export type User = {
  id: string;
  name: string;
};

const lsUser = new ObjectLocalStorage<User>("user");

const userState = atom<User | undefined>({
  key: "user",
  default: lsUser.get(),
});

export const userSelector = selector<User | undefined>({
  key: "userSelector",
  get: ({ get }) => get(userState),
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) newValue = undefined;
    lsUser.set(newValue);
    set(userState, newValue);
  },
});
