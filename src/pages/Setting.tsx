import {
  Button,
  Checkbox,
  Divider,
  Group,
  Input,
  MultiSelect,
  NumberInput,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import EbinaAPI, { WebAuthnSetting } from "../EbinaAPI";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
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

const WebAuthnDeviceSettings = () => {
  const [deviceName, setDeviceName] = useState("");
  const [waNames, setWaNames] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [enabledNames, setEnabledNames] = useState<string[]>([]);
  const [updatingEnable, setUpdatingEnable] = useState<boolean>(true);
  const [refreshDevices, setRefreshDevices] = useState(true);

  useEffect(() => {
    if (refreshDevices) {
      setRefreshDevices(false);
      EbinaAPI.getWebAuthnDeviceNames().then((names) => {
        Promise.all(names.map(async (name) => {
          const isEnable = await EbinaAPI.checkEnableWebAuthnDevice(name);
          if (isEnable) enabledNames.push(name);
        })).then(() => {
          setEnabledNames(enabledNames);
          setUpdatingEnable(false);
          setWaNames(names);
        });
      }).catch((err) => {
        alert(err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshDevices]);

  return (
    <Stack m={0}>
      <TextInput
        placeholder="Device Name"
        label="Device Name"
        onChange={(e) => {
          setDeviceName(e.target.value);
        }}
      />
      <Button
        disabled={!deviceName}
        onClick={() => {
          EbinaAPI.getWebAuthnRegistOptions().then((res) =>
            startRegistration(res)
          ).then((res) =>
            EbinaAPI.sendWebAuthnRegistCredential(res, deviceName)
          ).then(() => {
            setRefreshDevices(true);
          }).catch((err) => {
            alert(err);
          });
        }}
      >
        Regist WebAuthn
      </Button>
      <Button
        disabled={!deviceName}
        onClick={() => {
          EbinaAPI.deleteWebAuthnDevice(deviceName).then((res) => {
            setRefreshDevices(true);
          }).catch((err) => {
            alert(err);
          });
        }}
      >
        Delete Device
      </Button>
      <Divider />
      <Text>Enable devices</Text>
      {waNames.map((name) => {
        return (
          <Checkbox
            key={name}
            label={name}
            checked={enabledNames.includes(name)}
            disabled={updatingEnable}
            onChange={(event) => {
              setUpdatingEnable(true);
              const enabled = enabledNames.includes(name);
              const promise = enabled
                ? EbinaAPI.disableWebAuthnDevice(name)
                : EbinaAPI.enableWebAuthnDevice(name);
              promise.then(async () => {
                if (enabled) {
                  setEnabledNames(enabledNames.filter((it) => it !== name));
                } else {
                  enabledNames.push(name);
                  setEnabledNames(enabledNames);
                }
              }).finally(() => {
                setUpdatingEnable(false);
              });
            }}
          />
        );
      })}
      <Divider />
      <MultiSelect
        label="Devices"
        data={waNames}
        placeholder="Pick all that you like"
        defaultValue={waNames}
        clearButtonLabel="Clear selection"
        clearable
        onChange={(e) => {
          setSelectedNames(e);
        }}
      />
      <Button
        disabled={waNames.length === 0}
        onClick={() => {
          EbinaAPI.getWebAuthnVerifyOptions(selectedNames).then((res) =>
            startAuthentication(res)
          ).then((res) => EbinaAPI.sendWebAuthnVerifyCredential(res)).catch(
            (err) => {
              alert(err);
            },
          );
        }}
      >
        Verify WebAuthn
      </Button>
    </Stack>
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
        <WebAuthnDeviceSettings />
      </Tabs.Panel>
      <Tabs.Panel value="mongodb" pt="xs">
        <MongoDBSettings />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Setting;
