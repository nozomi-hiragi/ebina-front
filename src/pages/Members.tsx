import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Trash, UserPlus } from "tabler-icons-react";
import { userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";

const Members = () => {
  const user = useRecoilValue(userSelector);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [refreshUser, setRefreshUser] = useState(true);

  useEffect(() => {
    EbinaAPI.getUsers()
      .then((res) => setUsers(res))
      .catch((err) => alert(err));
    setRefreshUser(false);
  }, [refreshUser]);

  const columns = [
    { field: "id", headerName: "ID", flex: 0 },
    { field: "name", headerName: "Name", minWidth: 100, flex: 5 },
    { field: "created_at", headerName: "Create Date", minWidth: 200, flex: 1 },
    { field: "updated_at", headerName: "Update Date", minWidth: 200, flex: 1 },
  ];
  const hasSelectItem = selected.length > 0;

  const createMemberForm = useForm({
    initialValues: {
      id: "",
      name: "",
      pass: "",
    },
    validate: {},
  });

  return (
    <Stack>
      <Group position="apart">
        <Title order={4}>
          Members
        </Title>
        {hasSelectItem
          ? (
            <UnstyledButton onClick={() => setDeleteDialogOpen(true)}>
              <Trash />
            </UnstyledButton>
          )
          : (
            <UnstyledButton onClick={() => setCreateDialogOpen(true)}>
              <UserPlus />
            </UnstyledButton>
          )}
      </Group>
      <Table>
        <thead>
          <tr>
            <th>
              <Checkbox
                onChange={(e) => {
                  setSelected((v) =>
                    v.length ===
                        ((users.filter((member) => member.id === user?.id)
                          .length * -1) + users.length)
                      ? []
                      : users.filter((member) => member.id !== user?.id).map((
                        member,
                      ) => member.id)
                  );
                }}
                checked={selected.length ===
                  ((users.filter((member) => {
                    return member.id === user?.id;
                  }).length * -1) + users.length)}
                indeterminate={selected.length > 0 &&
                  selected.length !==
                    ((users.filter((member) => {
                      return member.id === user?.id;
                    }).length * -1) + users.length)}
              />
            </th>
            {columns.map((field) => (
              <th key={field.field}>
                {field.headerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((member) => {
            return (
              <tr key={member.id}>
                <td>
                  <Checkbox
                    disabled={!user || user.id === member.id}
                    checked={selected.includes(member.id)}
                    onChange={(e) => {
                      if (e.currentTarget.checked) {
                        setSelected([...selected, member.id]);
                      } else {
                        setSelected(selected.filter((v) => member.id !== v));
                      }
                    }}
                  />
                </td>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.created_at}</td>
                <td>{member.updated_at}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
      <Modal
        opened={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title={`Create User`}
      >
        <form
          onSubmit={createMemberForm.onSubmit((user) => {
            EbinaAPI.userRegist(user).then(() => {
              setCreateDialogOpen(false);
              setRefreshUser(true);
            }).catch((err) => {
              console.log(err.message);
            });
          })}
        >
          <TextInput
            required
            label="ID"
            placeholder="ID"
            type="text"
            {...createMemberForm.getInputProps("id")}
          />
          <TextInput
            required
            label="Name"
            placeholder="Name"
            type="text"
            {...createMemberForm.getInputProps("name")}
          />
          <TextInput
            required
            label="Pass"
            placeholder="Pass"
            type="password"
            {...createMemberForm.getInputProps("pass")}
          />
          <Group position="right" mt="md">
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </Group>
        </form>
      </Modal>
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
              EbinaAPI.deleteUsers(selected).then((res) => {
                setDeleteDialogOpen(false);
                setRefreshUser(true);
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
