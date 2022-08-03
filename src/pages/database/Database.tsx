import {
  ActionIcon,
  Button,
  Container,
  Group,
  Modal,
  Select,
  Space,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlaylistAdd, Trash } from "tabler-icons-react";
import EbinaAPI from "../../EbinaAPI";

const DatabaseData = () => {
  const [dbNames, setDBNames] = useState<string[]>([]);
  const [colNames, setColNames] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    const promises: Promise<any>[] = [];
    let newDBNames: string[];
    const newColNames = colNames;
    EbinaAPI.getDatabases().then((ret) => {
      newDBNames = ret.map((it) => {
        promises.push(
          EbinaAPI.getCollections(it.name).then((ret) =>
            newColNames[it.name] = ret
          ),
        );
        return it.name;
      });
    }).then(() => {
      Promise.all(promises).then(() => {
        setColNames(newColNames);
        setDBNames(newDBNames);
      });
    }).catch((err) => {
      console.error(err);
    });
    // eslint-disable-next-line
  }, []);

  return (
    <Stack>
      <Tabs orientation="vertical">
        <Tabs.List>
          {dbNames.map((name) => {
            return (
              <Tabs.Tab key={name} value={name}>
                {name}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
        {dbNames.map((dbName) => {
          return (
            <Tabs.Panel key={dbName} value={dbName} pl="xs">
              <Group>
                {colNames[dbName].map((colName) => {
                  return (
                    <Button<typeof Link>
                      key={colName}
                      component={Link}
                      to={`${dbName}/${colName}`}
                    >
                      {colName}
                    </Button>
                  );
                })}
              </Group>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Stack>
  );
};

type DBUser = { user: string; roles: DBRole[] };
type DBRole = { role: string; db: string };

const Users = () => {
  const [users, setUsers] = useState<{ [user: string]: DBUser }>({});
  const [openCreateUserModal, setOpenCreateUserModal] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [tempRole, setTempRole] = useState<DBRole>({ role: "", db: "" });

  const createUserForm = useForm({
    initialValues: {
      username: "",
      password: "",
      roles: [] as DBRole[],
    },
    validate: {
      roles: (value) => {
        if (!value.length) return "No Roles";
        for (const role of value) {
          if (!role.role || !role.db) return "role or db is missing";
        }
        return null;
      },
    },
  });

  useEffect(() => {
    EbinaAPI.getDBUsers()
      .then((ret) => {
        const users: { [name: string]: DBUser } = {};
        ret.forEach((user) => users[user.user] = user);
        setUsers(users);
      }).catch((err) => {
      });
    // eslint-disable-next-line
  }, [openCreateUserModal, deleteUsername]);

  return (
    <Container>
      <Group position="right">
        <Button onClick={() => setOpenCreateUserModal(true)}>Add User</Button>
      </Group>
      <Stack spacing="xs">
        {Object.keys(users).map((userName) => {
          return (
            <Group key={userName}>
              <Text>
                {`${userName}: [${
                  users[userName].roles
                    .map((role) => `${role.db}: ${role.role}`)
                    .join(", ")
                }]`}
              </Text>
              <ActionIcon onClick={() => setDeleteUsername(userName)}>
                <Trash />
              </ActionIcon>
            </Group>
          );
        })}
      </Stack>
      <Modal
        opened={openCreateUserModal}
        onClose={() => setOpenCreateUserModal(false)}
        title="Create User"
        size="lg"
      >
        <form
          onSubmit={createUserForm.onSubmit((value) => {
            EbinaAPI.createMongoDBUser(createUserForm.values).then((ret) => {
              if (ret.ok) {
                createUserForm.values = {
                  username: "",
                  password: "",
                  roles: [],
                };
                setTempRole({ role: "", db: "" });
                setOpenCreateUserModal(false);
              }
            }).catch((err) => {
              console.error(err);
            });
          })}
        >
          <TextInput
            required
            id="username"
            label="Username"
            type="text"
            {...createUserForm.getInputProps("username")}
          />
          <TextInput
            required
            id="password"
            label="Password"
            type="password"
            {...createUserForm.getInputProps("password")}
          />
          {createUserForm.values.roles.map((role) => {
            return (
              <Group key={role.role + role.db}>
                <Text>{role.db}: {role.role}</Text>
                <ActionIcon
                  onClick={() => {
                    createUserForm.values.roles = createUserForm.values.roles
                      .filter((target) =>
                        target.db !== role.db || target.role !== role.role
                      );
                    setTempRole({ role: "", db: "" });
                  }}
                >
                  <Trash />
                </ActionIcon>
              </Group>
            );
          })}
          <Space h="lg" />
          <Title order={4}>Roles</Title>
          <Group align="end">
            <Group>
              <TextInput
                id="db"
                label="DB"
                type="text"
                value={tempRole.db}
                onChange={(element) =>
                  setTempRole({ ...tempRole, db: element.currentTarget.value })}
                error={createUserForm.getInputProps("roles").error}
              />
              <Select
                sx={{ minWidth: 210 }}
                label="Role"
                placeholder="Pick one"
                value={tempRole.role}
                data={[
                  "read",
                  "readWrite",
                  "dbAdmin",
                  "dbOwner",
                  "userAdmin",
                  "clusterAdmin",
                  "clusterManager",
                  "clusterMonitor",
                  "hostManager",
                  "backup",
                  "restore",
                  "readAnyDatabase",
                  "readWriteAnyDatabase",
                  "userAdminAnyDatabase",
                  "dbAdminAnyDatabase",
                  "root",
                ]}
                onChange={(value) => setTempRole({ ...tempRole, role: value! })}
              />
            </Group>
            <ActionIcon
              my="xs"
              onClick={() => {
                if (!tempRole.role || !tempRole.db) {
                  return;
                }
                const { roles } = createUserForm.values;
                roles.push(tempRole);
                setTempRole({ role: "", db: "" });
                createUserForm.values.roles = roles;
              }}
            >
              <PlaylistAdd />
            </ActionIcon>
          </Group>
          <Group position="right" pt="md">
            <Button type="submit">
              Create User
            </Button>
          </Group>
        </form>
      </Modal>
      <Modal
        opened={deleteUsername !== ""}
        onClose={() => setDeleteUsername("")}
        title="Delete User"
      >
        <Stack>
          <Title order={3}>Delete {deleteUsername}?</Title>
          <Group position="right">
            <Button onClick={() => setDeleteUsername("")}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                EbinaAPI.deleteMongoDBUser(deleteUsername).then((res) => {
                  if (res.ok) {
                    setDeleteUsername("");
                  }
                }).catch((err) => {
                  console.error(err);
                });
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

const Database = () => {
  return (
    <Tabs defaultValue="database">
      <Tabs.List>
        <Tabs.Tab value="database">
          Database
        </Tabs.Tab>
        <Tabs.Tab value="users">
          Users
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="database" pt="xs">
        <DatabaseData />
      </Tabs.Panel>
      <Tabs.Panel value="users" pt="xs">
        <Users />
      </Tabs.Panel>
    </Tabs>
  );
};

export default Database;
