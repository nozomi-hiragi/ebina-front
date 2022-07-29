import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";
import { useForm } from "@mantine/form";
import { Button, Center, Group, Paper, TextInput, Title } from "@mantine/core";
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
        EbinaAPI.setURL(values.server);
        if (passwordLogin) {
          EbinaAPI.login({ id: values.id, pass: values.pass })
            .then((user) => setUser({ ...user, id: values.id }))
            .catch((err) => console.log(err.message));
        } else {
          EbinaAPI.getLoginOptions(values.id)
            .then((op) => {
              if (op) {
                return startAuthentication(op)
                  .then((ret) => EbinaAPI.loginWebAuthn(values.id, ret))
                  .then((user) => setUser({ ...user, id: values.id }));
              } else {
                setPasswordLogin(true);
              }
            })
            .catch((err) => console.log(err.message));
        }
      })}
    >
      <Center sx={{ height: "100vh" }}>
        <Paper shadow="xs" p="md">
          <Group
            sx={{ width: 250 }}
            direction="column"
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
          </Group>
        </Paper>
      </Center>
    </form>
  );
};

export default Login;
