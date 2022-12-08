import jwtDecode, { JwtPayload } from "jwt-decode";
import { Component, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from "recoil";
import { login } from "../EbinaAPI/i";
import { payloadSelector, tokenSelector } from "../recoil/user";

export class UnauthorizedError extends Error {}
export class AuthorizeFinish extends Error {}

let token = "";

const Reauth = (props: Props) => {
  const navigate = useNavigate();
  const payload = useRecoilValue(payloadSelector);
  const setToken = useSetRecoilState(tokenSelector);
  const resetToken = useResetRecoilState(tokenSelector);

  const isExpired = (token: string) =>
    (jwtDecode<JwtPayload>(token).exp ?? 0) < Date.now() / 1000;

  useEffect(() => {
    try {
      if (token && !isExpired(token)) return;
      if (!payload) throw new Error("no payload");
      login(payload.id).then((newToken) => {
        token = newToken;
        setToken(newToken);
      });
    } catch (err) {
      resetToken();
      navigate("/");
    }
    // eslint-disable-next-line
  }, []);
  if (token && !isExpired(token)) throw new AuthorizeFinish();
  return <>{props.children}</>;
};

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class UnauthorizedErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  public static getDerivedStateFromError(err: Error): State {
    return { hasError: err instanceof UnauthorizedError };
  }

  render() {
    if (this.state.hasError) return <Reauth />;
    return this.props.children;
  }
}

export default UnauthorizedErrorBoundary;
