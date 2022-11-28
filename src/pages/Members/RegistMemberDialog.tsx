import {
  ActionIcon,
  Button,
  CopyButton,
  Group,
  Image,
  Modal,
  ModalProps,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import QRCode from "qrcode";
import { tokenSelector } from "../../recoil/user";
import { Check, Copy } from "tabler-icons-react";
import { myFetch } from "../../EbinaAPI";

const MyCopyButton = (prop: { value: string }) => (
  <CopyButton value={prop.value} timeout={2000}>
    {({ copied, copy }) => (
      <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
        <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </ActionIcon>
      </Tooltip>
    )}
  </CopyButton>
);

const RegistMemberDialog = (props: Omit<ModalProps, "title">) => {
  const authToken = useRecoilValue(tokenSelector);
  const location = useLocation();
  const [url] = useLocalStorage<string>(
    { key: "server-url", defaultValue: "" },
  );
  const frontBase = useMemo(
    () => window.location.href.replace(location.pathname, ""),
    // eslint-disable-next-line
    [],
  );
  const requestRegistForm = useForm({
    initialValues: {
      server: "",
      front: "",
      id: "",
      name: "",
    },
  });
  const [registURL, setRegistURL] = useState("");
  const [token, setToken] = useState("");
  const [qrString, setQRString] = useState("");
  useEffect(() => {
    QRCode.toDataURL(registURL, { errorCorrectionLevel: "L" })
      .then((str) => setQRString(str));
  }, [registURL]);

  return (
    <Modal {...props} title="Regist Member">
      {token
        ? (
          <Stack>
            <Group>
              <Text>Token: {token}</Text>
              <MyCopyButton value={token} />
            </Group>
            {registURL && (
              <Group>
                <Text>URL: {registURL}</Text>
                <MyCopyButton value={registURL} />
              </Group>
            )}
            {qrString && <Image radius="xl" src={qrString} />}
            <Button
              onClick={() => {
                setRegistURL("");
                setToken("");
                setQRString("");
              }}
            >
              Done
            </Button>
          </Stack>
        )
        : (
          <form
            onSubmit={requestRegistForm.onSubmit((values) => {
              const server = values.server ?? url;
              const front = values.front ?? frontBase;
              myFetch(`${url}/ebina/member/regist/request`, {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
                body: JSON.stringify({ ...values, server, front }),
              }).then((res) => {
                if (!res.ok) throw new Error(res.status.toString());
                return res.json();
              }).then((ret) => {
                if (ret.url) setRegistURL(ret.url);
                setToken(ret.token);
              }).catch((err) => {
                alert(err);
              });
            })}
          >
            <TextInput
              mb="sm"
              label="Server"
              placeholder={url}
              {...requestRegistForm.getInputProps("server")}
            />
            <TextInput
              mb="sm"
              label="Front"
              placeholder={frontBase}
              {...requestRegistForm.getInputProps("front")}
            />
            <TextInput
              mb="sm"
              label="ID"
              placeholder="option"
              {...requestRegistForm.getInputProps("id")}
            />
            <TextInput
              mb="sm"
              label="Name"
              placeholder="option"
              {...requestRegistForm.getInputProps("name")}
            />
            <Group mt="lg" position="right">
              <Button type="submit">Request</Button>
            </Group>
          </form>
        )}
    </Modal>
  );
};

export default RegistMemberDialog;
