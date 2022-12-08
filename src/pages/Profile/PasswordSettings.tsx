import {
  Button,
  Group,
  PasswordInput,
  SimpleGrid,
  Stack,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useRecoilValue } from "recoil";
import { Check, X } from "tabler-icons-react";
import TOTPCodeInput from "../../components/TOTPCodeInput";
import { resetPassword, updatePassword } from "../../EbinaAPI/i";
import { tokenSelector } from "../../recoil/user";
import SettingItemCard from "./SettingItemCard";

const PasswordSettings = () => {
  const authToken = useRecoilValue(tokenSelector);
  const passChangeForm = useForm({
    initialValues: { current: "", to: "" },
    validate: {
      current: (v) => v ? null : "Require current Password",
      to: (v) => v ? null : "Require new Password",
    },
  });
  const passResetForm = useForm<{ code?: number; to: string }>({
    initialValues: { to: "" },
    validate: {},
  });
  return (
    <Stack mx="xs">
      <Title>Password Settings</Title>
      <SimpleGrid
        mx="xs"
        cols={2}
        verticalSpacing="xl"
        breakpoints={[
          { maxWidth: 1220, cols: 2, spacing: "md" },
          { maxWidth: 840, cols: 1, spacing: "sm", verticalSpacing: "md" },
          { maxWidth: "sm", cols: 2, spacing: "sm" },
          { maxWidth: 630, cols: 1, spacing: "sm", verticalSpacing: "md" },
        ]}
      >
        <SettingItemCard title="Change Password">
          <form
            onSubmit={passChangeForm.onSubmit((values) => {
              updatePassword(authToken, values).then(() => {
                passChangeForm.reset();
                showNotification({
                  title: "Password change success",
                  message: "Password chanded",
                  icon: <Check />,
                  color: "green",
                });
              }).catch(() =>
                passChangeForm.setFieldError("current", "Wrong Password")
              );
            })}
          >
            <PasswordInput
              mb="xs"
              label="Current Password"
              placeholder="12345678"
              {...passChangeForm.getInputProps("current")}
            />
            <PasswordInput
              mb="xs"
              label="New Password"
              placeholder="12345678"
              {...passChangeForm.getInputProps("to")}
            />
            <Group position="right" mt="xl">
              <Button type="submit" disabled={!passChangeForm.isValid()}>
                Change
              </Button>
            </Group>
          </form>
        </SettingItemCard>
        <SettingItemCard title="Reset Password">
          <form
            onSubmit={passResetForm.onSubmit((values) => {
              resetPassword(authToken, {
                ...values,
                code: String(values.code).padStart(6, "0"),
              }).then(() => {
                passResetForm.reset();
                showNotification({
                  title: "Password reset success",
                  message: "Password chanded",
                  icon: <Check />,
                  color: "green",
                });
              }).catch((err: Error) =>
                showNotification({
                  title: "Reset Password Failed",
                  message: err.message,
                  color: "red",
                  icon: <X />,
                })
              );
            })}
          >
            <TOTPCodeInput
              required
              mb="xs"
              placeholder="012345"
              {...passResetForm.getInputProps("code")}
            />
            <PasswordInput
              required
              mb="xs"
              label="New Password"
              placeholder="1qaz2wsx"
              {...passResetForm.getInputProps("to")}
            />
            <Group position="right" mt="xl">
              <Button type="submit">Reset</Button>
            </Group>
          </form>
        </SettingItemCard>
      </SimpleGrid>
    </Stack>
  );
};

export default PasswordSettings;
