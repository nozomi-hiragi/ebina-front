import { useMemo, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { Trash } from "tabler-icons-react";
import { payloadSelector } from "../recoil/user";
import EbinaAPI from "../EbinaAPI";
import { getMembers } from "../recoil/member";

const Members = () => {
  const payload = useRecoilValue(payloadSelector);
  const [members, setMembers] = useRecoilState(getMembers);
  const [selected, setSelected] = useState<string[]>([]);
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
        {hasSelect && (
          <UnstyledButton onClick={() => setDeleteDialogOpen(true)}>
            <Trash size={22} />
          </UnstyledButton>
        )}
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
      <Modal
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={`Delete User`}
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
