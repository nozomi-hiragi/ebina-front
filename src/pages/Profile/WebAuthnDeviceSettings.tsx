import {
  Button,
  Checkbox,
  DefaultProps,
  Group,
  PasswordInput,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Check, Settings, Trash, TrashX, X } from "tabler-icons-react";
import TOTPCodeInput from "../../components/TOTPCodeInput";
import {
  checkEnableWebAuthnDevice,
  checkWebAuthnVerify,
  deleteWebAuthnDevice,
  disableWebAuthnDevice,
  enableWebAuthnDevice,
  getWebAuthnDeviceNames,
  registWebAuthnDevice,
} from "../../EbinaAPI/i";
import { tokenSelector } from "../../recoil/user";
import SettingItemCard from "./SettingItemCard";

const PasswordTOTPInput = (
  { passwordInputProps, totpInputProps, ...props }:
    & DefaultProps
    & { passwordInputProps: any; totpInputProps: any },
) => {
  return (
    <Group grow position="apart" {...props}>
      <PasswordInput
        required
        label="Password"
        placeholder="1qaz2wsx"
        autoComplete="current-password"
        {...passwordInputProps}
      />
      <TOTPCodeInput required placeholder="012345" {...totpInputProps} />
    </Group>
  );
};

const RegistDeviceCard = (
  { onSuccess }: {
    onSuccess?: (deviceName: string, enabledDeviceNames: string[]) => void;
  },
) => {
  const authToken = useRecoilValue(tokenSelector);
  const registForm = useForm<
    { deviceName: string; pass: string; code?: number }
  >({ initialValues: { deviceName: "", pass: "" }, validate: {} });

  return (
    <SettingItemCard title="Regist Device">
      <form
        onSubmit={registForm.onSubmit((values) => {
          console.log(values);
          registWebAuthnDevice(authToken, {
            ...values,
            code: String(values.code).padStart(6, "0"),
          }).then((res) => {
            registForm.reset();
            onSuccess && onSuccess(values.deviceName, res);
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
          required
          label="Device Name"
          placeholder="Device Name"
          {...registForm.getInputProps("deviceName")}
        />
        <PasswordTOTPInput
          mt="xs"
          passwordInputProps={registForm.getInputProps("pass")}
          totpInputProps={registForm.getInputProps("code")}
        />
        <Button mt="xl" fullWidth type="submit">Regist WebAuthn</Button>
      </form>
    </SettingItemCard>
  );
};

const DeleteDeviceCard = ({ deviceNames, onSuccess }: {
  deviceNames: string[];
  onSuccess?: (deviceName: string) => void;
}) => {
  const authToken = useRecoilValue(tokenSelector);
  const deleteForm = useForm<{
    mode: "WebAuthn" | "Password";
    deviceName: string;
    pass: string;
    code?: number;
  }>({
    initialValues: { mode: "WebAuthn", deviceName: "", pass: "" },
    validate: { deviceName: (v) => v ? null : "Choose device" },
  });
  return (
    <SettingItemCard title="Delete Device">
      <form
        onSubmit={deleteForm.onSubmit(({ mode, deviceName, ...values }) => {
          deleteWebAuthnDevice(authToken, deviceName, mode, {
            ...values,
            code: String(values.code).padStart(6, "0"),
          }).then(() => {
            deleteForm.reset();
            onSuccess && onSuccess(deviceName);
            showNotification({
              title: "Delete Device Success",
              message: "Device removed",
              color: "green",
              icon: <Trash />,
            });
          }).catch((err: Error) =>
            showNotification({
              title: "Delete Device Failed",
              message: err.message,
              color: "red",
              icon: <TrashX />,
            })
          );
        })}
      >
        <Select
          required
          mb="sm"
          label="Devie"
          placeholder="Choose a device to delete"
          data={deviceNames}
          {...deleteForm.getInputProps("deviceName")}
        />
        <SegmentedControl
          fullWidth
          color="orange"
          data={[
            { label: "WebAuthn", value: "WebAuthn" },
            { label: "Password & Code", value: "Password" },
          ]}
          {...deleteForm.getInputProps("mode")}
        />
        {deleteForm.values.mode === "Password" && (
          <PasswordTOTPInput
            passwordInputProps={deleteForm.getInputProps("pass")}
            totpInputProps={deleteForm.getInputProps("code")}
          />
        )}
        <Group position="right" mt="lg">
          <Button type="submit">Delete Device</Button>
        </Group>
      </form>
    </SettingItemCard>
  );
};

const WebAuthnDeviceSettingCards = (
  { deviceNames, setDeviceNames }: {
    deviceNames: string[];
    setDeviceNames: (v: string[]) => void;
  },
) => {
  const authToken = useRecoilValue(tokenSelector);

  const [enabledNames, setEnabledNames] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  useEffect(() => {
    const enable: string[] = [];
    Promise.all(
      deviceNames.map((name) =>
        checkEnableWebAuthnDevice(authToken, name).then((isEnable) => {
          if (isEnable) enable.push(name);
        })
      ),
    ).then(() => setEnabledNames(enable));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SimpleGrid
      mx="xs"
      cols={3}
      verticalSpacing="xl"
      breakpoints={[
        { maxWidth: 1220, cols: 2, spacing: "md" },
        { maxWidth: 840, cols: 1, spacing: "sm", verticalSpacing: "md" },
        { maxWidth: "sm", cols: 2, spacing: "sm" },
        { maxWidth: 630, cols: 1, spacing: "sm", verticalSpacing: "md" },
      ]}
    >
      <RegistDeviceCard
        onSuccess={(deviceName, enabledDeviceNames) => {
          setEnabledNames(enabledDeviceNames);
          setDeviceNames(deviceNames.concat(deviceName));
        }}
      />

      {deviceNames.length !== 0 && (
        <>
          <DeleteDeviceCard
            deviceNames={deviceNames}
            onSuccess={(deviceName) =>
              setDeviceNames(deviceNames.filter((v) => v !== deviceName))}
          />
          <SettingItemCard title="Enable Login Device">
            <Switch.Group
              value={enabledNames}
              label="Select enable devices"
              description="Enabled devices are available for login. When all devices are disabled, only first position device available for login."
              onChange={async (chosedNames) => {
                console.log(chosedNames);
                const chosed = chosedNames.filter((v) =>
                  deviceNames.includes(v)
                );
                const enabled = enabledNames.filter((v) =>
                  deviceNames.includes(v)
                );
                const toEnableDevices = chosed
                  .filter((name) => !enabled.includes(name));
                const toDisableDevices = enabled
                  .filter((name) => !chosed.includes(name));

                let namesResult = new Set(enabled);
                Promise.all([
                  ...toEnableDevices.map((name) =>
                    enableWebAuthnDevice(authToken, name)
                      .then(() => namesResult.add(name))
                      .catch(() => {})
                  ),
                  ...toDisableDevices.map((name) =>
                    disableWebAuthnDevice(authToken, name)
                      .then(() => namesResult.delete(name))
                      .catch(() => {})
                  ),
                ]).then(() => setEnabledNames(Array.from(namesResult)));
              }}
            >
              {deviceNames.map((name) => (
                <Switch
                  key={name}
                  label={name}
                  value={name}
                />
              ))}
            </Switch.Group>
          </SettingItemCard>

          <SettingItemCard title="Check Device Auth">
            <Checkbox.Group
              value={selectedNames}
              label="Select devices to check"
              description="If multiple devices are selected, the higher priority device will be used."
              onChange={(names) => {
                setSelectedNames(names);
              }}
            >
              {deviceNames.map((name) => (
                <Checkbox key={name} value={name} label={name} />
              ))}
            </Checkbox.Group>

            <Group position="right" mt="xs">
              <Button
                onClick={() => {
                  const selected = selectedNames
                    .filter((v) => deviceNames.includes(v));
                  setSelectedNames(selected);
                  checkWebAuthnVerify(authToken, selected)
                    .then(() =>
                      showNotification({
                        message: "Verified!",
                        color: "green",
                        icon: <Check />,
                      })
                    ).catch((err: Error) =>
                      showNotification(
                        { message: err.message, color: "red", icon: <X /> },
                      )
                    );
                }}
              >
                Check
              </Button>
            </Group>
          </SettingItemCard>
        </>
      )}
    </SimpleGrid>
  );
};

const WebAuthnDeviceSettings = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [deviceNames, setDevieNames] = useState<string[] | undefined>();

  useEffect(() => {
    getWebAuthnDeviceNames(authToken)
      .then((names) => setDevieNames(names)).catch((err: Error) =>
        showNotification({
          title: "Get WebAuthn Devices Error",
          message: err.message,
          color: "red",
          icon: <X />,
        })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack mx="xs">
      <Title>WebAuthn Device Settings</Title>
      {deviceNames
        ? (
          <WebAuthnDeviceSettingCards
            deviceNames={deviceNames}
            setDeviceNames={setDevieNames}
          />
        )
        : (
          <SettingItemCard title="WebAuthn is not enabled on this server">
            <Text>
              Please setting WebAuthn on Setting page.
            </Text>
            <Group position="right" mt="xs">
              <Button
                variant="outline"
                compact
                leftIcon={<Settings size={18} />}
                component={Link}
                to="../settings"
              >
                Settings Page
              </Button>
            </Group>
          </SettingItemCard>
        )}
    </Stack>
  );
};

export default WebAuthnDeviceSettings;
