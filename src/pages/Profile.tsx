import {
  Button,
  Center,
  Checkbox,
  Group,
  Paper,
  PasswordInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import EbinaAPI from "../EbinaAPI";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { ReactNode, useEffect, useState } from "react";
import { Settings } from "tabler-icons-react";
import { Link } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";
import { useForm } from "@mantine/form";

const Card = ({ children, title }: { children: ReactNode; title: string }) => (
  <Center>
    <Paper p="lg" shadow="md" withBorder sx={{ width: 380, maxWidth: 380 }}>
      <Text size="lg" weight={500} mb="xs">{title}</Text>
      {children}
    </Paper>
  </Center>
);

const WebAuthnDeviceSettingCards = (
  { deviceNames, setDeviceNames }: {
    deviceNames: string[];
    setDeviceNames: (v: string[]) => void;
  },
) => {
  const [registDeviceName, setRegistDeviceName] = useState("");
  const [deleteDeviceName, setDeleteDeviceName] = useState("");

  const [enabledNames, setEnabledNames] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  useEffect(() => {
    const enable: string[] = [];
    Promise.all(
      deviceNames.map((name) =>
        EbinaAPI.checkEnableWebAuthnDevice(name).then((isEnable) => {
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
      <Card title="Regist Device">
        <TextInput
          placeholder="Device Name"
          label="Device Name"
          value={registDeviceName}
          onChange={(e) => setRegistDeviceName(e.target.value)}
        />
        <Group position="right" mt="xs">
          <Button
            disabled={!registDeviceName}
            onClick={() => {
              const name = registDeviceName;
              EbinaAPI.getWebAuthnRegistOptions(name)
                .then((res) => startRegistration(res))
                .then((res) => EbinaAPI.sendWebAuthnRegistCredential(res))
                .then((res) => {
                  setRegistDeviceName("");
                  setEnabledNames(res);
                  setDeviceNames(deviceNames.concat(name));
                })
                .catch((err) => alert(err));
            }}
          >
            Regist WebAuthn
          </Button>
        </Group>
      </Card>

      {deviceNames.length !== 0 && (
        <>
          <Card title="Delete Device">
            <Select
              label="Devie"
              placeholder="Choose a device to delete"
              value={deleteDeviceName}
              data={deviceNames}
              onChange={(name) => setDeleteDeviceName(name ?? "")}
            />
            <Group position="right" mt="xs">
              <Button
                disabled={!deleteDeviceName}
                onClick={() => {
                  const name = deleteDeviceName;
                  EbinaAPI.deleteWebAuthnDevice(name)
                    .then(() => {
                      setDeleteDeviceName("");
                      setDeviceNames(deviceNames.filter((v) => v !== name));
                    })
                    .catch((err) => alert(err));
                }}
              >
                Delete Device
              </Button>
            </Group>
          </Card>

          <Card title="Enable Login Device">
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
                    EbinaAPI.enableWebAuthnDevice(name)
                      .then(() => namesResult.add(name))
                      .catch(() => {})
                  ),
                  ...toDisableDevices.map((name) =>
                    EbinaAPI.disableWebAuthnDevice(name)
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
          </Card>

          <Card title="Check Device Auth">
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
                  EbinaAPI.getWebAuthnVerifyOptions(selected)
                    .then((res) => startAuthentication(res))
                    .then((res) => EbinaAPI.sendWebAuthnVerifyCredential(res))
                    .then(() => alert("Verified!"))
                    .catch((err) => {
                      alert(err);
                    });
                }}
              >
                Check
              </Button>
            </Group>
          </Card>
        </>
      )}
    </SimpleGrid>
  );
};

const WebAuthnDeviceSettings = () => {
  const [deviceNames, setDevieNames] = useState<string[] | undefined>();

  useEffect(() => {
    EbinaAPI.getWebAuthnDeviceNames()
      .then((names) => setDevieNames(names))
      .catch((err) => {
        alert(err);
      });
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
          <Card title="WebAuthn is not enabled on this server">
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
          </Card>
        )}
    </Stack>
  );
};

const PasswordSettings = () => {
  const passwordForm = useForm({
    initialValues: {
      current: "",
      new: "",
    },
    validate: {
      current: (v) => v ? null : "Require current Password",
      new: (v) => v ? null : "Require new Password",
    },
  });
  return (
    <Stack mx="xs">
      <Title>Password Settings</Title>
      <Card title="Change Password">
        <form
          onSubmit={passwordForm.onSubmit((values) => {
            EbinaAPI.updatePassword(values).then((ret) => {
              if (ret.ok) {
                if (ret.options) {
                  startAuthentication(ret.options).then((ret) => {
                    EbinaAPI.updatePassword(ret).then((ret) => {
                      if (ret.ok) {
                        alert("Password change success");
                        passwordForm.setValues({ current: "", new: "" });
                      } else {
                        if (ret.status === 404) {
                          passwordForm.setFieldError(
                            "current",
                            "Wrong Password",
                          );
                        } else {
                          alert("Auth failed");
                        }
                      }
                    });
                  });
                  console.log(ret.options);
                } else {
                  alert("Password change success");
                  passwordForm.setValues({ current: "", new: "" });
                }
              } else {
                const message = ret.status === 401 ? "Wrong Password" : "error";
                passwordForm.setFieldError("current", message);
              }
            });
          })}
        >
          <Stack mt="md">
            <PasswordInput
              label="Current Password"
              placeholder="12345678"
              {...passwordForm.getInputProps("current")}
            />
            <PasswordInput
              label="New Password"
              placeholder="12345678"
              {...passwordForm.getInputProps("new")}
            />
          </Stack>
          <Group position="right" mt="md">
            <Button type="submit" disabled={!passwordForm.isValid()}>
              Change
            </Button>
          </Group>
        </form>
      </Card>
    </Stack>
  );
};

const Setting = () => {
  const isLarge = useMediaQuery("(min-width: 1000px)");
  return (
    <Tabs
      variant="outline"
      defaultValue="webauthn"
      orientation={isLarge ? "vertical" : "horizontal"}
      sx={{ height: "100%" }}
    >
      <Tabs.List>
        <Tabs.Tab value="webauthn">WebAuthn</Tabs.Tab>
        <Tabs.Tab value="password">Password</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="webauthn">
        <WebAuthnDeviceSettings />
      </Tabs.Panel>
      <Tabs.Panel value="password">
        <PasswordSettings />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Setting;
