import { Tabs } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import OneTimePass from "./OneTimePass";
import PasswordSettings from "./PasswordSettings";
import PushNotificationSettings from "./PushNotificationSettings";
import WebAuthnDeviceSettings from "./WebAuthnDeviceSettings";

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
        <Tabs.Tab value="otp">One Time Pass</Tabs.Tab>
        <Tabs.Tab value="push">Push Notification</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="webauthn">
        <WebAuthnDeviceSettings />
      </Tabs.Panel>
      <Tabs.Panel value="password">
        <PasswordSettings />
      </Tabs.Panel>
      <Tabs.Panel value="otp">
        <OneTimePass />
      </Tabs.Panel>
      <Tabs.Panel value="push">
        <PushNotificationSettings />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Setting;
