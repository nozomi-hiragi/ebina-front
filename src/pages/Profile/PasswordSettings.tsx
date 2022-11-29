import { Button, Group, PasswordInput, Stack, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { startAuthentication } from "@simplewebauthn/browser";
import EbinaAPI from "../../EbinaAPI";
import SettingItemCard from "./SettingItemCard";

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
      <SettingItemCard title="Change Password">
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
      </SettingItemCard>
    </Stack>
  );
};

export default PasswordSettings;
