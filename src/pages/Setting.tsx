import {
  Button,
  Checkbox,
  Divider,
  Group,
  MultiSelect,
  Text,
  TextInput,
} from "@mantine/core";
import EbinaAPI from "../EbinaAPI";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { useEffect, useState } from "react";

const Setting = () => {
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
  }, [refreshDevices]);

  return (
    <Group m={0} direction="column" grow>
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
    </Group>
  );
};

export default Setting;
