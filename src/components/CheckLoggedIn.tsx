import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { loggedIn } from "../recoil/user";

const CheckLoggedIn = ({ children }: { children: ReactNode }) => {
  return useRecoilValue(loggedIn) ? <>{children}</> : <Navigate to="/login" />;
};

export default CheckLoggedIn;
