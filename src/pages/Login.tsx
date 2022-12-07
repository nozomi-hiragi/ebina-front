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
  PasswordInput,
  Select,
  Text,
  TextInput,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import {
  browserSupportsWebAuthnAutofill,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useLocalStorage } from "@mantine/hooks";
import {
  getLoginOptions,
  loginWithPassword,
  loginWithWAOption,
} from "../EbinaAPI/i";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverURL],
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
        setHistory([query, ...history.slice(0, 2)]);
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
  const [loginMode, setLoginMode] = useState<
    "Password" | "WebAuthn"
  >("WebAuthn");
  const [serverError, setServerError] = useState("");
  const [serverURL, setServerURL] = useState("");

  type LoginFormValues = {
    id: string;
    name: string;
    pass: string;
  };

  const loginForm = useForm<LoginFormValues>({
    initialValues: { id: "", name: "", pass: "" },
    validate: {},
  });

  const startLoginAuth = (result: any, id?: string) =>
    startAuthentication(result.options, id === undefined).then((ret) => {
      // ResidentKey非対応対応
      if (ret.response.userHandle === undefined) {
        if (id === undefined) throw new Error("id required");
        ret.response.userHandle = id;
      }
      return ret;
    }).then((ret) => loginWithWAOption(ret, result.sessionId))
      .then((token) => setAuthToken(token));

  const startConditionalUI = () =>
    browserSupportsWebAuthnAutofill().then((support) => {
      if (!support) return;
      console.log("Support Conditial UI");
      getLoginOptions().then((ret) => {
        if (ret.type === "WebAuthn") startLoginAuth(ret);
        else console.log("No WebAuthn options");
      });
    });

  const actualLoginActions = {
    "WebAuthn": (result: any, id: string) => startLoginAuth(result, id),
    "Password": () => setLoginMode("Password"),
  };

  const submitActions = {
    "WebAuthn": (values: LoginFormValues) =>
      getLoginOptions(values.id)
        .then((ret) => actualLoginActions[ret.type](ret, values.id))
        .catch((err) => console.log(err.message)),
    "Password": (values: LoginFormValues) =>
      loginWithPassword(values.id, values.pass)
        .then((token) => setAuthToken(token)),
  };

  return (
    <Paper p={30} shadow="md" withBorder sx={{ width: 350 }}>
      <Title order={1}>Login</Title>
      <ServerSelect
        mt="sm"
        onChangeServerURL={(url) => {
          const prevURL = serverURL;
          setServerURL(url);
          if (url && prevURL === "") startConditionalUI();
        }}
        error={serverError}
      />
      <form
        onSubmit={loginForm.onSubmit((values) => {
          if (serverURL) submitActions[loginMode](values);
          else setServerError("Input server url");
        })}
      >
        <TextInput
          mt="sm"
          label="ID"
          placeholder="ID"
          autoComplete="username webauthn"
          disabled={!serverURL}
          {...loginForm.getInputProps("id")}
        />
        {loginMode !== "WebAuthn" && (
          <PasswordInput
            mt="sm"
            id="pass"
            label="Password"
            required
            autoComplete={loginMode === "Password"
              ? "current-password"
              : "new-password"}
            disabled={!serverURL}
            {...loginForm.getInputProps("pass")}
          />
        )}
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
        <Group grow>
          {loginMode === "Password" && (
            <Button
              disabled={!serverURL}
              onClick={() => setLoginMode("WebAuthn")}
            >
              Use WebAuthn
            </Button>
          )}
          <Button
            disabled={!serverURL}
            fullWidth={loginMode === "WebAuthn"}
            type="submit"
          >
            Login
          </Button>
        </Group>
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

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
