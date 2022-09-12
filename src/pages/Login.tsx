import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";
import { useForm } from "@mantine/form";
import { Button, Center, Paper, Stack, TextInput, Title } from "@mantine/core";
import { startAuthentication } from "@simplewebauthn/browser";

const Login = () => {
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(userSelector);
  const [passwordLogin, setPasswordLogin] = useState(false);

  const loginForm = useForm({
    initialValues: {
      server: "",
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

  useEffect(() => {
    if (user) navigate("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <form
      onSubmit={loginForm.onSubmit((values) => {
        const login = (
          body:
            | { type: "password"; id: string; pass: string }
            | { type: "public-key"; [key: string]: any },
        ) =>
          EbinaAPI.login(body)
            .then((user) => setUser({ ...user, id: values.id }))
            .catch((err) => console.log(err.message));

        EbinaAPI.setURL(values.server);
        if (passwordLogin) {
          login({ type: "password", id: values.id, pass: values.pass });
        } else {
          EbinaAPI.getLoginOptions(values.id)
            .then((ret) => {
              switch (ret.type) {
                case "password":
                  setPasswordLogin(true);
                  break;
                case "WebAuthn":
                  startAuthentication(ret.options).then((ret) =>
                    login({
                      ...ret,
                      response: { ...ret.response, userHandle: values.id },
                    })
                  );
                  break;
              }
            })
            .catch((err) => console.log(err.message));
        }
      })}
    >
      <Center sx={{ height: "100vh" }}>
        <Paper shadow="xs" p="md">
          <Stack
            sx={{ width: 250 }}
            align="center"
          >
            <Title order={1} m="xs">Login</Title>
            <TextInput
              required
              id="server"
              label="Server"
              type="url"
              {...loginForm.getInputProps("server")}
            />
            <TextInput
              required
              id="id"
              label="ID"
              type="text"
              {...loginForm.getInputProps("id")}
            />
            {passwordLogin && (
              <TextInput
                required
                id="pass"
                label="PASS"
                type="password"
                {...loginForm.getInputProps("pass")}
              />
            )}
            <Button
              type="submit"
              m="xs"
            >
              Login
            </Button>
          </Stack>
        </Paper>
      </Center>
    </form>
  );
};

export default Login;
