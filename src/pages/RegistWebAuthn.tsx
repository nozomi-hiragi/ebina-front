import {
  Button,
  Center,
  Group,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useSearchParams } from "react-router-dom";
import { Check, X } from "tabler-icons-react";
import TOTPCodeInput from "../components/TOTPCodeInput";
import { lsServer } from "../EbinaAPI";
import { registWebAuthnDevice } from "../EbinaAPI/i";

const RegistWebAuthn = () => {
  const [searchParams] = useSearchParams();
  const registForm = useForm<
    { deviceName: string; id: string; pass: string; code?: number }
  >({
    initialValues: {
      deviceName: "",
      id: searchParams.get("i") ?? "",
      pass: "",
    },
    validate: {},
  });
  return (
    <Center sx={{ height: "100vh" }}>
      <Paper p={30} shadow="md" withBorder sx={{ width: 350 }}>
        <Title order={1}>Regist WebAuthn Device</Title>
        <Text mt="sm">URL: {lsServer.get()}</Text>
        <form
          onSubmit={registForm.onSubmit((values) => {
            registWebAuthnDevice({ type: "ID", value: values.id }, {
              ...values,
              code: String(values.code).padStart(6, "0"),
            }).then(() => {
              registForm.reset();
              showNotification({
                title: "Regist Device Success",
                message: "Device registed",
                color: "green",
                icon: <Check />,
              });
            }).catch((err: Error) =>
              showNotification({
                title: "Regist Device Failed",
                message: err.message,
                color: "red",
                icon: <X />,
              })
            );
          })}
        >
          <TextInput
            mb="xs"
            label="ID"
            autoComplete="username webauthn"
            disabled={searchParams.has("i")}
            {...registForm.getInputProps("id")}
          />
          <TextInput
            mb="xs"
            label="Device Name"
            autoComplete="nickname"
            {...registForm.getInputProps("deviceName")}
          />
          <Group mb="sm" grow position="apart">
            <PasswordInput
              required
              id="pass"
              label="Password"
              placeholder="1qaz2wsx"
              autoComplete="current-password"
              {...registForm.getInputProps("pass")}
            />
            <TOTPCodeInput
              required
              placeholder="123456"
              {...registForm.getInputProps("code")}
            />
          </Group>
          <Button mt="lg" fullWidth type="submit">Regist</Button>
        </form>
      </Paper>
    </Center>
  );
};

export default RegistWebAuthn;
