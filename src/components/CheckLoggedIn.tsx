import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { loggedIn, payloadSelector, tokenSelector } from "../recoil/user";
import { UnauthorizedError } from "./UnauthorizedErrorBoundary";

const CheckLoggedIn = ({ children }: { children: ReactNode }) => {
  const isLeggedIn = useRecoilValue(loggedIn);
  const token = useRecoilValue(tokenSelector);
  const payload = useRecoilValue(payloadSelector);

  if (!isLeggedIn) return <Navigate to="/login" />;
  if (!token) throw new UnauthorizedError();
  if (!payload?.exp || payload.exp + 1 < Date.now() / 1000) {
    throw new UnauthorizedError();
  }

  return <>{children}</>;
};

export default CheckLoggedIn;
