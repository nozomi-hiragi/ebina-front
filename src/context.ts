import { createContext } from "react";

export type User = {
  id: string,
  name: string,
  created_at: string,
  updated_at: string,
  iat: number,
  exp: number,
} | null

type UserContextValue = {
  user: User,
  setUser: (value: React.SetStateAction<User>) => void,
}

export const UserContext = createContext<UserContextValue>({ user: null, setUser: (() => { }), })
