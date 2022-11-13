import { useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Link, useNavigate } from "react-router-dom";
import { userSelector } from "../recoil/user";
import EbinaAPI from "../EbinaAPI";
import { useForm } from "@mantine/form";
import {
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
  startRegistration,
} from "@simplewebauthn/browser";
import { useLocalStorage } from "@mantine/hooks";

type ServerSelectProps = {
  error?: string;
  onChangeServerURL?: (url: string) => void;
};
const ServerSelect = (
  { error, onChangeServerURL, ...props }: ServerSelectProps & DefaultProps,
) => {
  const [msgError, setMsgError] = useState(error ?? "");
  const [history, setHistory] = useLocalStorage<string[]>({
    key: "server-history",
    defaultValue: [],
  });
  const [url, setURL] = useLocalStorage<string>({
    key: "server-url",
    defaultValue: "",
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onChangeServerURL && onChangeServerURL(url), [url]);

  return (
    <Select
      label="Server"
      placeholder="Choose your server"
      nothingFound="No servers"
      data={history}
      value={url}
      creatable
      clearable
      searchable
      getCreateLabel={(query) => `+ Add "${query}"`}
      onCreate={(query) => {
        setHistory(history.concat([query]));
        return query;
      }}
      onChange={(query) => {
        setMsgError("");
        if (query === null && url) {
          setHistory(history.filter((i) => i !== url));
        }
        setURL(query ?? "");
      }}
      error={msgError}
      {...props}
    />
  );
};

const LoginCard = () => {
  const setUser = useSetRecoilState(userSelector);
  const [loginMode, setLoginMode] = useState<
    "Password" | "WebAuthn" | "Regist"
  >("WebAuthn");
  const [token, setToken] = useState("");
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
    startAuthentication(result.options, id === undefined)
      .then((ret) => {
        // ResidentKey非対応対応
        if (ret.response.userHandle === undefined) {
          if (id === undefined) throw new Error("id required");
          ret.response.userHandle = id;
        }
        return EbinaAPI.loginWithWAOption(ret, result.sessionId);
      }).then((user) => setUser(user));

  const startConditionalUI = () =>
    browserSupportsWebAuthnAutofill().then((support) => {
      if (!support) return;
      console.log("Support Conditial UI");
      EbinaAPI.getLoginOptions().then((ret) => startLoginAuth(ret));
    });

  const actualLoginActions = {
    "WebAuthn": (result: any, id: string) => startLoginAuth(result, id),
    "Password": () => setLoginMode("Password"),
    "Regist": (result: { token: string }) => {
      setToken(result.token);
      setLoginMode("Regist");
    },
  };

  const submitActions = {
    "WebAuthn": (values: LoginFormValues) =>
      EbinaAPI.getLoginOptions(values.id)
        .then((ret) => actualLoginActions[ret.type](ret, values.id))
        .catch((err) => console.log(err.message)),
    "Password": (values: LoginFormValues) =>
      EbinaAPI.loginWithPassword(values.id, values.pass)
        .then((user) => setUser(user)),
    "Regist": (values: LoginFormValues) =>
      EbinaAPI.memberRegistRequest(values)
        .then((ret) => startRegistration(ret))
        .then((result) =>
          EbinaAPI.memberRegistVerify({ id: values.id, result, token })
        ).then(() => alert("Success!")),
  };

  return (
    <Paper p={30} shadow="md" withBorder sx={{ width: 350 }}>
      <Title order={1}>Login</Title>
      <ServerSelect
        mt="sm"
        onChangeServerURL={(url) => {
          const prevURL = serverURL;
          setServerURL(url);
          if (!url) return;
          EbinaAPI.setURL(url);
          if (prevURL === "") startConditionalUI();
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
          disabled={(!serverURL) || loginMode === "Regist"}
          {...loginForm.getInputProps("id")}
        />
        {loginMode === "Regist" && (
          <TextInput
            mt="sm"
            label="Name"
            placeholder="Name"
            required
            autoComplete="nickname"
            disabled={!serverURL}
            {...loginForm.getInputProps("name")}
          />
        )} {loginMode !== "WebAuthn" && (
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
        <Group grow>
          {loginMode === "Password" && (
            <Button
              mt="xl"
              disabled={!serverURL}
              onClick={() => setLoginMode("WebAuthn")}
            >
              Use WebAuthn
            </Button>
          )}
          <Button
            mt="xl"
            disabled={!serverURL}
            fullWidth={loginMode === "WebAuthn"}
            type="submit"
          >
            {loginMode === "Regist" ? "Regist" : "Login"}
          </Button>
        </Group>
      </form>
    </Paper>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const user = useRecoilValue(userSelector);
  const [eula] = useLocalStorage<string>({ key: "eula", defaultValue: "" });
  const { colorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (user) navigate("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
