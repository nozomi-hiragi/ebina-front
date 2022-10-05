import {
  Button,
  Group,
  Input,
  NumberInput,
  SegmentedControl,
  Stack,
  Tabs,
  TextInput,
} from "@mantine/core";
import EbinaAPI, { WebAuthnSetting } from "../EbinaAPI";
import { useEffect, useState } from "react";
import { useForm } from "@mantine/form";

const WebAuthnSettings = () => {
  const [disableChange, setDisableChange] = useState(true);
  const webauthnSettingsForm = useForm<WebAuthnSetting>({
    initialValues: {
      rpName: "",
      rpIDType: "variable",
      rpID: "",
      attestationType: undefined,
    },
    validate: {
      rpID: (value: string | undefined, values: WebAuthnSetting) =>
        values.rpIDType === "static" && !value ? "err" : null,
    },
  });

  useEffect(() => {
    EbinaAPI.getWebAuthnSettings().then((settings) => {
      webauthnSettingsForm.setValues(settings);
      setDisableChange(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      onSubmit={webauthnSettingsForm.onSubmit(() => {
        setDisableChange(true);
        EbinaAPI.setWebAuthnBSettings(webauthnSettingsForm.values)
          .catch((err) => console.error(err))
          .finally(() => setDisableChange(false));
      })}
    >
      <Stack>
        <TextInput
          placeholder="RP Name"
          label="RP Name"
          disabled={disableChange}
          {...webauthnSettingsForm.getInputProps("rpName")}
        />
        <Input.Wrapper label="RP ID Type">
          <Group>
            <SegmentedControl
              data={[
                { label: "Variable", value: "variable" },
                { label: "Static", value: "static" },
              ]}
              disabled={disableChange}
              {...webauthnSettingsForm.getInputProps("rpIDType")}
            />
          </Group>
        </Input.Wrapper>
        {webauthnSettingsForm.values.rpIDType === "static" && (
          <TextInput
            placeholder="RP ID"
            label="RP ID"
            disabled={disableChange}
            {...webauthnSettingsForm.getInputProps("rpID")}
          />
        )}
        <Input.Wrapper label="Attestation Type">
          <Group>
            <SegmentedControl
              data={[
                { label: "Direct", value: "direct" },
                { label: "Indirect", value: "indirect" },
                { label: "None", value: "none" },
                // { label: "Enterprise", value: "enterprise" },
              ]}
              disabled={disableChange}
              {...webauthnSettingsForm.getInputProps("attestationType")}
            />
          </Group>
        </Input.Wrapper>
        <Group position="right" mt="md">
          <Button type="submit" disabled={disableChange}>Save</Button>
        </Group>
      </Stack>
    </form>
  );
};

const MongoDBSettings = () => {
  const [disableChange, setDisableChange] = useState(true);

  const mongodbSettingsForm = useForm({
    initialValues: {
      hostname: "",
      port: 0,
      username: "",
      password: "",
    },
    validate: {},
  });

  useEffect(() => {
    EbinaAPI.getMongoDBSettings().then((res) => {
      mongodbSettingsForm.setValues(res);
      setDisableChange(false);
    }).catch((err) => {
      console.error(err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      onSubmit={mongodbSettingsForm.onSubmit(() => {
        setDisableChange(true);
        EbinaAPI.setMongoDBSettings(mongodbSettingsForm.values)
          .catch((err) => console.error(err))
          .finally(() => setDisableChange(false));
      })}
    >
      <Stack>
        <TextInput
          label="hostname"
          placeholder="localhost"
          required
          disabled={disableChange}
          {...mongodbSettingsForm.getInputProps("hostname")}
        />
        <NumberInput
          label="port"
          placeholder="27017"
          required
          disabled={disableChange}
          {...mongodbSettingsForm.getInputProps("port")}
        />
        <TextInput
          label="username"
          placeholder="env"
          required
          disabled={disableChange}
          {...mongodbSettingsForm.getInputProps("username")}
        />
        <TextInput
          label="password"
          placeholder="env"
          required
          disabled={disableChange}
          {...mongodbSettingsForm.getInputProps("password")}
        />
        <Group position="right" mt="md">
          <Button type="submit" disabled={disableChange}>Save</Button>
        </Group>
      </Stack>
    </form>
  );
};

const Setting = () => {
  return (
    <Tabs defaultValue="webauthn">
      <Tabs.List position="center">
        <Tabs.Tab value="webauthn">
          WebAuthn
        </Tabs.Tab>
        <Tabs.Tab value="mongodb">
          MongoDB
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="webauthn" pt="xs">
        <WebAuthnSettings />
      </Tabs.Panel>
      <Tabs.Panel value="mongodb" pt="xs">
        <MongoDBSettings />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Setting;
