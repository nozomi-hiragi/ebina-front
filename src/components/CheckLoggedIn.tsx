import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userSelector } from "../recoil/user";

const CheckLoggedIn = ({ children }: { children: ReactNode }) => {
  return useRecoilValue(userSelector)
    ? <>{children}</>
    : <Navigate to="/login" />;
};

export default CheckLoggedIn;
