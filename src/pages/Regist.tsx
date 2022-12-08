import {
  AppShell,
  Button,
  Center,
  Paper,
  PasswordInput,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useLocalStorage } from "@mantine/hooks";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EbinaHeader from "../components/EbinaHeader";
import { lsServer } from "../EbinaAPI";
import { registTempMember } from "../EbinaAPI/member";

const TOKEN_LEN = 32;

const RegistCard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useLocalStorage<string[]>(
    { key: "server-history", defaultValue: [] },
  );
  const [searchParams] = useSearchParams();
  const hasServer = useMemo(() => searchParams.has("s"), [searchParams]);
  const hasToken = useMemo(() => searchParams.has("t"), [searchParams]);
  const registForm = useForm({
    initialValues: {
      server: searchParams.get("s") ?? lsServer.get() ?? "",
      token: searchParams.get("t") ?? "",
      id: searchParams.get("i") ?? "",
      name: searchParams.get("n") ?? "",
      pass: "",
    },
    validate: {
      server: (value) => {
        try {
          new URL(value);
          return null;
        } catch {
          return "Invarid URL";
        }
      },
      token: (value) => value.length >= TOKEN_LEN ? null : "Invarid Token",
    },
  });

  return (
    <Paper p={30} shadow="md" withBorder sx={{ width: 350 }}>
      <Title order={1} mb="sm">Regist</Title>
      <form
        onSubmit={registForm.onSubmit(({ server, ...values }) => {
          registTempMember(server, values).then(() => {
            if (!history.includes(server)) setHistory([server, ...history]);
            lsServer.set(server);
            registForm.reset();
            alert("Regist is success. Please request admit to admin.");
            navigate("/login");
          }).catch((err) => alert(err));
        })}
      >
        <TextInput
          mb={hasServer ?? "sm"}
          label="Server"
          placeholder="https://"
          required={!hasServer}
          disabled={hasServer}
          variant={hasServer ? "unstyled" : "default"}
          {...registForm.getInputProps("server")}
        />
        {!hasToken && (
          <TextInput
            mb="sm"
            label="Token"
            placeholder="qawsedrftgyhujikolp"
            required
            {...registForm.getInputProps("token")}
          />
        )}
        <TextInput
          mb="sm"
          label="ID"
          placeholder="ID"
          required
          autoComplete="username webauthn"
          {...registForm.getInputProps("id")}
        />
        <TextInput
          mb="sm"
          label="Name"
          placeholder="Name"
          required
          autoComplete="nickname"
          {...registForm.getInputProps("name")}
        />
        <PasswordInput
          mb="sm"
          id="pass"
          label="Password"
          placeholder="1qaz2wsx"
          required
          autoComplete="new-password"
          {...registForm.getInputProps("pass")}
        />
        <Button mt="xl" fullWidth type="submit">Regist</Button>
      </form>
    </Paper>
  );
};

const Regist = () => {
  return (
    <AppShell header={<EbinaHeader />}>
      <Center sx={{ height: "100%" }}>
        <RegistCard />
      </Center>
    </AppShell>
  );
};

export default Regist;
