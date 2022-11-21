import {
  Button,
  Card,
  Group,
  Select,
  Stack,
  Stepper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { X } from "tabler-icons-react";
import { lsServer, myFetch } from "../../EbinaAPI";
import { tokenSelector } from "../../recoil/user";
import SettingItemCard from "./SettingItemCard";

const RegistPushCard = () => {
  const [swr, setSWR] = useState<ServiceWorkerRegistration | undefined>();
  const [notificationPermisson, setNotificationPermisson] = useState<
    NotificationPermission
  >(Notification.permission);
  const [subscription, setSubscription] = useState<
    PushSubscriptionJSON | undefined
  >();
  const token = useRecoilValue(tokenSelector);
  const [deviceName, setDeviceName] = useLocalStorage({
    key: "webpushdevicename",
    defaultValue: "",
  });

  const activeState = useMemo(
    () =>
      swr ? notificationPermisson === "granted" ? deviceName ? 3 : 2 : 1 : 0,
    [swr, notificationPermisson, deviceName],
  );

  const subscribeForm = useForm({
    initialValues: { deviceName },
    validate: {},
  });

  useEffect(() => {
    navigator.serviceWorker.ready.then((registration) => {
      if (!registration || !registration.pushManager) return;
      setSWR(registration);
      registration.pushManager.getSubscription()
        .then((subscription) => {
          if (!subscription) return setDeviceName("");
          setSubscription(subscription.toJSON());
        });
    });
    // eslint-disable-next-line
  }, []);

  return (
    <Card withBorder>
      <Title order={3} mb={"sm"}>Regist Push</Title>
      <Stepper active={activeState} breakpoint="lg">
        <Stepper.Step
          label="Support WebPush"
          description="Browser must support WebPush"
          color={swr ? undefined : "red"}
          icon={swr ? undefined : <X />}
        >
          <Text fz="xl" color="red">This browser does not support WebPush</Text>
        </Stepper.Step>
        <Stepper.Step
          label="Notification permission"
          description="Allow Notification permission"
        >
          {notificationPermisson === "denied"
            ? <Text>Please change your notification permission.</Text>
            : (
              <Button
                onClick={() =>
                  Notification.requestPermission()
                    .then((ret) => setNotificationPermisson(ret))}
              >
                Show Notification permission alert
              </Button>
            )}
        </Stepper.Step>
        <Stepper.Step label="Subscribe" description="Regist your identifier">
          <form
            onSubmit={subscribeForm.onSubmit(() => {
              myFetch(
                `${lsServer.get()}/ebina/i/webpush/subscribed/${subscribeForm.values.deviceName}`,
                {
                  method: "GET",
                  headers: { Authorization: `Bearer ${token}` },
                },
              ).then((ret) => {
                if (!ret.ok) throw new Error(ret.status.toString());
                return ret.json();
              }).then((json) =>
                json as {
                  subscribed: boolean;
                  applicationServerKey?: string;
                }
              ).then(({ subscribed, applicationServerKey }) => {
                if (subscribed) {
                  subscribeForm.setErrors({
                    deviceName: "Already used this device name",
                  });
                  return;
                }
                if (!swr) throw new Error("No Service Worker");
                swr.pushManager.subscribe(
                  { userVisibleOnly: true, applicationServerKey },
                ).then((subscription) => {
                  setSubscription(subscription);
                  myFetch(`${lsServer.get()}/ebina/i/webpush/device`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      deviceName: subscribeForm.values.deviceName,
                      subscription: subscription.toJSON(),
                    }),
                  }).then((res) => {
                    if (!res.ok) throw new Error(res.status.toString());
                    setDeviceName(subscribeForm.values.deviceName);
                  });
                });
              }).catch((err: Error) => alert(err.message));
            })}
          >
            <TextInput
              label="Device name"
              placeholder={window.navigator.userAgent}
              required
              {...subscribeForm.getInputProps("deviceName")}
            />
            <Button mt="lg" type="submit">Subscribe</Button>
          </form>
        </Stepper.Step>
        <Stepper.Completed>
          <Title order={3} mb="sm">Device name: {`"${deviceName}"`}</Title>
          <Text>If you have some probrem, try Resubscribe.</Text>
          <Group mt="sm">
            <Button
              onClick={() => {
                if (!swr) return alert("No Service Worker");
                swr.pushManager.getSubscription().then((sub) => {
                  if (!sub) {
                    setDeviceName("");
                    setSubscription(undefined);
                    alert("Please try again");
                    return;
                  }
                  if (!subscription) setSubscription(sub);
                  myFetch(`${lsServer.get()}/ebina/i/webpush/device`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                      deviceName: subscribeForm.values.deviceName,
                      subscription: sub.toJSON(),
                    }),
                  }).then((res) => {
                    if (!res.ok) return alert(res.status);
                    setDeviceName(subscribeForm.values.deviceName);
                  });
                });
              }}
            >
              Resubscribe
            </Button>
            <Button
              onClick={() => {
                myFetch(`${lsServer.get()}/ebina/i/webpush/test`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ deviceName }),
                });
              }}
            >
              Request Test Push
            </Button>
            <Button
              onClick={() => {
                const notification = new Notification(
                  "This is local notification",
                );
                notification.addEventListener("click", () =>
                  notification.close());
              }}
            >
              Notification API Test
            </Button>
          </Group>
        </Stepper.Completed>
      </Stepper>
    </Card>
  );
};

const PushSettings = () => {
  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [selectDevice, setSelectDevice] = useState<string | null>(null);
  const token = useRecoilValue(tokenSelector);

  useEffect(() => {
    myFetch(`${lsServer.get()}/ebina/i/webpush/devices/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (ret) => {
      if (!ret.ok) return;
      const deviceNames = await ret.json();
      setDeviceNames(deviceNames);
    });
  }, []);

  return (
    <Stack mx="xs">
      <Title>Push Notification Settings</Title>
      <RegistPushCard />
      <SettingItemCard title="Delete device">
        {deviceNames.length !== 0
          ? (
            <>
              <Select
                label="Which device to delete?"
                placeholder="Device name"
                data={deviceNames.map((deviceName) => ({
                  value: deviceName,
                  label: deviceName,
                }))}
                onChange={setSelectDevice}
              />
              <Group mt="md" position="right">
                <Button
                  disabled={selectDevice === null || selectDevice === ""}
                  onClick={() => {
                    myFetch(`${lsServer.get()}/ebina/i/webpush/device/`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ deviceName: selectDevice }),
                    }).then(async (ret) => {
                      if (!ret.ok) return;
                      const deviceNames = await ret.json();
                      setSelectDevice(null);
                      setDeviceNames(deviceNames);
                    });
                  }}
                >
                  Delete
                </Button>
              </Group>
            </>
          )
          : <Text>No devices</Text>}
      </SettingItemCard>
    </Stack>
  );
};

export default PushSettings;
