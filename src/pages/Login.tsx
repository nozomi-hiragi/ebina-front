import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { User, userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";
import { useForm } from "@mantine/form";
import {
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  TextInput,
  Title,
} from "@mantine/core";
import {
  browserSupportsWebAuthnAutofill,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useLocalStorage } from "@mantine/hooks";

const Login = () => {
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userSelector);
  const [passwordLogin, setPasswordLogin] = useState(false);
  const [serverURL, setServerURL] = useLocalStorage<string>({
    key: "server-url",
    defaultValue: "",
  });

  const loginForm = useForm({
    initialValues: {
      server: serverURL,
      id: "",
      pass: "",
    },
    validate: {
      server: (value) => {
        try {
          const url = new URL(value);
          console.log(url.protocol);
          switch (url.protocol) {
            case "http:":
            case "https:":
              return null;
            default:
              return "wrong protocol";
          }
        } catch (err) {
          return "URL error";
        }
      },
    },
  });

  const startAuth = (result: any, id?: string) =>
    startAuthentication(result.options, id === undefined)
      .then((ret) => {
        // ResidentKey非対応対応
        if (ret.response.userHandle === undefined) {
          if (id === undefined) throw new Error("id required");
          ret.response.userHandle = id;
        }
        return EbinaAPI.loginWithWAOption(ret, result.sessionId);
      }).then((user) => setUserData(user));

  useEffect(() => {
    if (loginForm.values.server === serverURL) return;
    loginForm.setValues({ server: serverURL });

    // Conditional UI
    browserSupportsWebAuthnAutofill().then((support) => {
      if (!support) return;
      console.log("Support Conditial UI");
      EbinaAPI.getLoginOptions().then((ret) => startAuth(ret));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverURL]);

  useEffect(() => {
    if (user) navigate("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const setUserData = (user: User) => {
    setUser(user);
    setServerURL(loginForm.values.server);
  };

  return (
    <Center sx={{ height: "100vh" }}>
      <Paper p={30} shadow="md" withBorder sx={{ width: 350 }}>
        <Title order={1}>Login</Title>
        <form
          onSubmit={loginForm.onSubmit((values) => {
            EbinaAPI.setURL(values.server);
            if (passwordLogin) {
              EbinaAPI.loginWithPassword(values.id, values.pass)
                .then((user) => setUserData(user));
            } else {
              EbinaAPI.getLoginOptions(values.id)
                .then((ret) => {
                  if (ret) startAuth(ret, values.id);
                  else setPasswordLogin(true);
                }).catch((err) => console.log(err.message));
            }
          })}
        >
          <TextInput
            mt="sm"
            label="Server"
            placeholder="http://localhost:3456"
            type="url"
            inputMode="url"
            required
            {...loginForm.getInputProps("server")}
          />
          <TextInput
            mt="sm"
            label="ID"
            placeholder="ID"
            autoComplete="username webauthn"
            {...loginForm.getInputProps("id")}
          />
          {passwordLogin && (
            <PasswordInput
              mt="sm"
              id="pass"
              label="PASS"
              required
              autoComplete="current-password"
              {...loginForm.getInputProps("pass")}
            />
          )}
          <Group grow={passwordLogin}>
            {passwordLogin && (
              <Button
                mt="xl"
                onClick={() => setPasswordLogin(false)}
              >
                Use WebAuthn
              </Button>
            )}
            <Button
              mt="xl"
              fullWidth={!passwordLogin}
              type="submit"
            >
              Login
            </Button>
          </Group>
        </form>
      </Paper>
    </Center>
  );
};

export default Login;
