import { useEffect, useMemo, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  ActionIcon,
  Button,
  Checkbox,
  CopyButton,
  Group,
  Image,
  Modal,
  ModalProps,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { Check, Copy, Trash, UserPlus } from "tabler-icons-react";
import { payloadSelector, tokenSelector } from "../recoil/user";
import EbinaAPI, { myFetch } from "../EbinaAPI";
import { getMembers } from "../recoil/member";
import { useForm } from "@mantine/form";
import { useLocalStorage } from "@mantine/hooks";
import { useLocation } from "react-router-dom";
import QRCode from "qrcode";

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

interface RegistMemberDialogProps extends Omit<ModalProps, "title"> {}
const RegistMemberDialog = (props: RegistMemberDialogProps) => {
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

const Members = () => {
  const payload = useRecoilValue(payloadSelector);
  const [members, setMembers] = useRecoilState(getMembers);
  const [selected, setSelected] = useState<string[]>([]);
  const [registDialogOpen, setRegistDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const membersWOM = useMemo(
    () => members.filter((member) => member.id !== payload?.id),
    [members, payload],
  );
  const isCheckedAll = useMemo(
    () => selected.length === membersWOM.length,
    [selected, membersWOM],
  );
  const hasSelect = useMemo(() => selected.length > 0, [selected]);

  const columns = [
    { field: "id", headerName: "ID", flex: 0 },
    { field: "name", headerName: "Name", minWidth: 100, flex: 5 },
    { field: "created_at", headerName: "Create Date", minWidth: 200, flex: 1 },
    { field: "updated_at", headerName: "Update Date", minWidth: 200, flex: 1 },
  ];

  return (
    <Stack>
      <Group position="apart">
        <Title order={4}>Members</Title>
        <UnstyledButton
          onClick={() =>
            hasSelect ? setDeleteDialogOpen(true) : setRegistDialogOpen(true)}
        >
          {hasSelect ? <Trash size={22} /> : <UserPlus size={22} />}
        </UnstyledButton>
      </Group>
      <Table>
        <thead>
          <tr>
            <th>
              <Checkbox
                onChange={() =>
                  setSelected(
                    isCheckedAll ? [] : membersWOM.map((member) => member.id),
                  )}
                checked={isCheckedAll}
                indeterminate={hasSelect && !isCheckedAll}
              />
            </th>
            {columns.map((field) => (
              <th key={field.field}>{field.headerName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <Checkbox
                  disabled={!payload || payload.id === member.id}
                  checked={selected.includes(member.id)}
                  onChange={({ currentTarget: { checked } }) =>
                    setSelected(
                      checked
                        ? [...selected, member.id]
                        : selected.filter((v) => member.id !== v),
                    )}
                />
              </td>
              <td>{member.id}</td>
              <td>{member.name}</td>
              <td>{member.created_at}</td>
              <td>{member.updated_at}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <RegistMemberDialog
        opened={registDialogOpen}
        onClose={() => setRegistDialogOpen(false)}
      />
      <Modal
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Member"
      >
        <Text color="red">{`Delete "${selected}"?`}</Text>
        <Group position="right">
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              EbinaAPI.deleteUsers(selected).then(() => {
                setDeleteDialogOpen(false);
                setMembers(members
                  .filter((member) => !selected.includes(member.id)));
                setSelected([]);
              }).catch((err) => {
                console.log(err);
              });
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};

export default Members;
