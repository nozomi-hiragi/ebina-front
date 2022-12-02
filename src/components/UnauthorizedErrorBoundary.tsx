import { Button, Group, Modal, PasswordInput, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { startAuthentication } from "@simplewebauthn/browser";
import jwtDecode, { JwtPayload } from "jwt-decode";
import { Component, ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from "recoil";
import {
  getLoginOptions,
  loginWithPassword,
  loginWithWAOption,
} from "../EbinaAPI/i";
import { payloadSelector, tokenSelector } from "../recoil/user";

export class UnauthorizedError extends Error {}
export class AuthorizeFinish extends Error {}

let token = "";

type PasswordDialogProps = {
  opend: boolean;
  onClose: () => void;
  onLoggedIn: () => void;
};
const PasswordDialog = (props: PasswordDialogProps) => {
  const payload = useRecoilValue(payloadSelector);
  const setToken = useSetRecoilState(tokenSelector);
  const loginForm = useForm({ initialValues: { pass: "" } });
  return (
    <Modal centered opened={props.opend} onClose={props.onClose} title="Login">
      <form
        onSubmit={loginForm.onSubmit(async (values) => {
          if (!payload) {
            throw new Error("No payload");
          }
          await loginWithPassword(payload.id, values.pass).then((newToken) => {
            token = newToken;
            setToken(newToken);
            props.onClose();
            props.onLoggedIn();
          }).catch(() => {
            loginForm.setErrors({ pass: "Login failed" });
          });
        })}
      >
        <PasswordInput
          mt="lg"
          required
          label="Password"
          autoComplete="current-password"
          {...loginForm.getInputProps("pass")}
        />
        <Group mt="lg" grow>
          <Button type="submit">Login</Button>
        </Group>
      </form>
    </Modal>
  );
};

const Reauth = (props: Props) => {
  const navigate = useNavigate();
  const [isPassword, setIsPassword] = useState(false);
  const payload = useRecoilValue(payloadSelector);
  const setToken = useSetRecoilState(tokenSelector);
  const resetToken = useResetRecoilState(tokenSelector);

  const isExpired = (token: string) =>
    (jwtDecode<JwtPayload>(token).exp ?? 0) < Date.now() / 1000;

  useEffect(() => {
    try {
      if (token && !isExpired(token)) return;
      if (!payload) throw new Error("no payload");
      getLoginOptions(payload.id).then(async (ret) => {
        if (ret.type === "Password") return setIsPassword(true);
        startAuthentication(ret.options)
          .then((result) => loginWithWAOption(result, ret.sessionId))
          .then((newToken) => {
            token = newToken;
            setToken(newToken);
          });
      });
    } catch (err) {
      resetToken();
      navigate("/");
    }
    // eslint-disable-next-line
  }, []);
  if (token && !isExpired(token)) throw new AuthorizeFinish();
  return (
    <Stack>
      {props.children}
      {isPassword && (
        <PasswordDialog
          opend={isPassword}
          onClose={() => setIsPassword(false)}
          onLoggedIn={() => {
            setIsPassword(false);
            throw new AuthorizeFinish();
          }}
        />
      )}
    </Stack>
  );
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
