import { atom, selector, DefaultValue } from 'recoil'
import * as LS from './localstorageDelegate'

export type User = {
  id: string,
  name: string,
  created_at: string,
  updated_at: string,
  iat: number,
  exp: number,
} | null

const userState = atom<User>({ key: 'user', default: null, })

export const userSelector = selector<User>({
  key: 'userSelector',
  get: ({ get }) => get(userState),
  set: ({ set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      set(userState, null)
      return
    }
    if (newValue && newValue.exp < Math.floor(Date.now() / 1000)) LS.remove(LS.ITEM.User)
    else LS.set(LS.ITEM.User, JSON.stringify(newValue))
    set(userState, newValue)
  },
})
