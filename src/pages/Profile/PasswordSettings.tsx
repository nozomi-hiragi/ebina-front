import { Button, Group, PasswordInput, Stack, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useRecoilValue } from "recoil";
import { Check } from "tabler-icons-react";
import { updatePassword } from "../../EbinaAPI/i";
import { tokenSelector } from "../../recoil/user";
import SettingItemCard from "./SettingItemCard";

const PasswordSettings = () => {
  const authToken = useRecoilValue(tokenSelector);
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
      <SettingItemCard title="Change Password">
        <form
          onSubmit={passwordForm.onSubmit((values) => {
            updatePassword(authToken, values).then(() => {
              showNotification({
                title: "Password change success",
                message: "Password chanded",
                icon: <Check />,
                color: "green",
              });
              passwordForm.setValues({ current: "", new: "" });
            }).catch(() =>
              passwordForm.setFieldError("current", "Wrong Password")
            );
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
      </SettingItemCard>
    </Stack>
  );
};

export default PasswordSettings;
