import {
  Button,
  Image,
  PasswordInput,
  Stack,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import QRCode from "qrcode";
import { requestTOTP, updateTOTP } from "../../EbinaAPI/i";
import { tokenSelector } from "../../recoil/user";
import SettingItemCard from "./SettingItemCard";
import TOTPCodeInput from "../../components/TOTPCodeInput";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { Check, X } from "tabler-icons-react";

const OneTimePass = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [uri, setURI] = useState("");
  const [qrString, setQRString] = useState("");
  const registForm = useForm<{ pass: string; code?: number }>({
    initialValues: { pass: "" },
    validate: {},
  });

  return (
    <Stack mx="xs">
      <Title>One Time Pass</Title>
      <SettingItemCard title="Regist Device">
        {uri
          ? (
            <Stack>
              <UnstyledButton component="a" href={uri}>
                <Image radius="xl" src={qrString} />
              </UnstyledButton>
              <form
                onSubmit={registForm.onSubmit((values) =>
                  updateTOTP(
                    authToken,
                    values.pass,
                    String(values.code).padStart(6, "0"),
                  ).then(() => {
                    setURI("");
                    setQRString("");
                    registForm.reset();
                    showNotification({
                      title: "Regist Success",
                      message: "Device Updated",
                      icon: <Check />,
                      color: "green",
                    });
                  }).catch((err: Error) => {
                    showNotification({
                      title: "Regist Error",
                      message: err.message,
                      icon: <X />,
                      color: "red",
                    });
                  })
                )}
              >
                <PasswordInput
                  mt="sm"
                  id="pass"
                  label="Password"
                  required
                  autoComplete="current-password"
                  {...registForm.getInputProps("pass")}
                />
                <TOTPCodeInput {...registForm.getInputProps("code")} />
                <Button mt="xl" fullWidth type="submit">Regist</Button>
              </form>
            </Stack>
          )
          : (
            <Button
              fullWidth
              onClick={() =>
                requestTOTP(authToken).then((uri) => {
                  setURI(uri);
                  QRCode.toDataURL(uri, { errorCorrectionLevel: "L" })
                    .then((str) => {
                      setQRString(str);
                    });
                })}
            >
              Generate
            </Button>
          )}
      </SettingItemCard>
    </Stack>
  );
};

export default OneTimePass;
