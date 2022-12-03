import {
  Button,
  Checkbox,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Settings } from "tabler-icons-react";
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

const WebAuthnDeviceSettingCards = (
  { deviceNames, setDeviceNames }: {
    deviceNames: string[];
    setDeviceNames: (v: string[]) => void;
  },
) => {
  const authToken = useRecoilValue(tokenSelector);
  const [registDeviceName, setRegistDeviceName] = useState("");
  const [deleteDeviceName, setDeleteDeviceName] = useState("");

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
      <SettingItemCard title="Regist Device">
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
              registWebAuthnDevice(authToken, name).then((res) => {
                setRegistDeviceName("");
                setEnabledNames(res);
                setDeviceNames(deviceNames.concat(name));
              }).catch((err) => alert(err));
            }}
          >
            Regist WebAuthn
          </Button>
        </Group>
      </SettingItemCard>

      {deviceNames.length !== 0 && (
        <>
          <SettingItemCard title="Delete Device">
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
                  deleteWebAuthnDevice(authToken, name).then(() => {
                    setDeleteDeviceName("");
                    setDeviceNames(deviceNames.filter((v) => v !== name));
                  }).catch((err) => alert(err));
                }}
              >
                Delete Device
              </Button>
            </Group>
          </SettingItemCard>

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
                    .then(() => alert("Verified!"))
                    .catch((err) => alert(err));
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
