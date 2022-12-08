import { useCallback, useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Link, useNavigate } from "react-router-dom";
import { loggedIn, tokenSelector } from "../recoil/user";
import { lsServer } from "../EbinaAPI";
import { useForm } from "@mantine/form";
import {
  Anchor,
  Button,
  Center,
  DefaultProps,
  Group,
  Paper,
  Select,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { browserSupportsWebAuthnAutofill } from "@simplewebauthn/browser";
import { useLocalStorage } from "@mantine/hooks";
import { login } from "../EbinaAPI/i";
import { showNotification } from "@mantine/notifications";
import { X } from "tabler-icons-react";

type ServerSelectProps = {
  error?: string;
  onChangeServerURL?: (url: string) => void;
};
const ServerSelect = (
  { error, onChangeServerURL, ...props }: ServerSelectProps & DefaultProps,
) => {
  const [msgError, setMsgError] = useState(error ?? "");
  const [history, setHistory] = useLocalStorage<string[]>(
    { key: "server-history", defaultValue: [] },
  );
  const [serverURL, setServerURL] = useState(lsServer.get());
  const saveServerURL = useCallback((url: string) => {
    setServerURL(url);
    lsServer.set(url);
  }, [setServerURL]);

  useEffect(
    () => onChangeServerURL && onChangeServerURL(serverURL ?? ""),
    [serverURL, onChangeServerURL],
  );

  return (
    <Select
      label="Server"
      placeholder="Choose your server"
      nothingFound="No servers"
      data={history}
      value={serverURL}
      creatable
      clearable
      searchable
      getCreateLabel={(query) => `+ Add "${query}"`}
      onCreate={(query) => {
        setHistory((prev) => [query, ...prev.slice(0, 2)]);
        return query;
      }}
      onChange={(query) => {
        setMsgError("");
        if (query && history.includes(query)) {
          setHistory((prev) => [query, ...prev.filter((v) => v !== query)]);
        }
        saveServerURL(query ?? "");
      }}
      error={msgError}
      {...props}
    />
  );
};

const LoginCard = () => {
  const setAuthToken = useSetRecoilState(tokenSelector);
  const [serverURL, setServerURL] = useState("");

  const loginForm = useForm({ initialValues: { id: "" }, validate: {} });

  const startLoginAuth = (id?: string) => login(id).then(setAuthToken);

  const startConditionalUI = () =>
    browserSupportsWebAuthnAutofill().then((support) => {
      if (!support) throw new Error("Conditial UI Not Support");
    }).then(() => startLoginAuth())
      .catch((err: Error) => console.log(err.message));

  return (
    <Paper p={30} shadow="md" withBorder sx={{ width: 350 }}>
      <Title order={1}>Login</Title>
      <ServerSelect
        mt="sm"
        onChangeServerURL={(url) => {
          const prevURL = serverURL;
          setServerURL(url);
          console.log(prevURL + "l" + url);
          if (url && prevURL === "") startConditionalUI();
        }}
      />
      <form
        onSubmit={loginForm.onSubmit((values) =>
          startLoginAuth(values.id).catch((err) =>
            showNotification({
              title: "Login Error",
              message: err.message,
              color: "red",
              icon: <X />,
            })
          )
        )}
      >
        <TextInput
          mt="sm"
          label="ID"
          placeholder="ID"
          autoComplete="username webauthn"
          disabled={!serverURL}
          {...loginForm.getInputProps("id")}
        />
        <Group>
          <Anchor
            my="xs"
            size="sm"
            component={Link}
            to={`/webauthn?i=${loginForm.values.id}`}
          >
            Add WebAuthn device
          </Anchor>
        </Group>
        <Button disabled={!serverURL} fullWidth type="submit">Login</Button>
      </form>
    </Paper>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const isLoggedIn = useRecoilValue(loggedIn);
  const [eula] = useLocalStorage<string>({ key: "eula", defaultValue: "" });
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (isLoggedIn) navigate("/dashboard");
  }, [isLoggedIn, navigate]);

  return (
    <Center sx={{ height: "100vh" }}>
      {eula
        ? <LoginCard />
        : (
          <Paper p={30} shadow="md" withBorder sx={{ width: 350 }}>
            <Text>EULAに同意してください。</Text>
            <Group mt="lg" position="right">
              <Button
                variant="outline"
                color={colorScheme === "dark" ? "gray" : "dark"}
                component={Link}
                to="/getting-started"
              >
                はじめかた
              </Button>
            </Group>
          </Paper>
        )}
    </Center>
  );
};

export default Login;
