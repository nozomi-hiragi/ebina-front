import { ReactNode, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useRecoilState } from "recoil"
import { userSelector } from "../atoms"
import * as LS from '../localstorageDelegate';

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useRecoilState(userSelector)

  const userStr = LS.get(LS.ITEM.User)
  const localUser = userStr ? JSON.parse(userStr) : null
  const isExpired = localUser && localUser.exp < Math.floor(Date.now() / 1000)
  const isLogedin = (user || localUser) && !isExpired

  useEffect(() => {
    if (user) return
    if (isExpired) {
      setUser(null)
    } else {
      if (localUser) setUser(localUser)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return isLogedin ? <>{children}</> : <Navigate to='/login' />
}

export default RequireAuth
