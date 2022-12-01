import {
  ActionIcon,
  Button,
  Card,
  Group,
  JsonInput,
  Menu,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { closeModal, openConfirmModal, openModal } from "@mantine/modals";
import { showNotification, updateNotification } from "@mantine/notifications";
import { startAuthentication } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { Check, Dots, Edit, MessagePlus, Trash, X } from "tabler-icons-react";
import { lsServer, myFetch } from "../../EbinaAPI";
import { tokenSelector } from "../../recoil/user";

interface FuncItem {
  name: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
}

const FuncItemForm = (
  props: { onSave: (item: FuncItem) => void; closeKey: string } & FuncItem,
) => {
  const { onSave, ...item } = props;
  const editForm = useForm({ initialValues: item });
  return (
    <form
      onSubmit={editForm.onSubmit((values) => {
        if (values.method === "GET" || values.method === "DELETE") {
          values.body = undefined;
        }
        onSave(values);
        closeModal(props.closeKey);
      })}
    >
      <TextInput
        mb="sm"
        label="Name"
        required
        {...editForm.getInputProps("name")}
      />
      <TextInput
        mb="sm"
        label="Path"
        required
        {...editForm.getInputProps("path")}
      />
      <SegmentedControl
        mb="sm"
        data={["GET", "POST", "PUT", "PATCH", "DELETE"]}
        {...editForm.getInputProps("method")}
      />
      {editForm.values.method !== "GET" &&
        editForm.values.method !== "DELETE" && (
        <JsonInput
          mb="sm"
          label="Body"
          autosize
          validationError="Invalid json but ok if you do so"
          {...editForm.getInputProps("body")}
        />
      )}
      <Group position="right" mt="md">
        <Button variant="default" onClick={() => closeModal(props.closeKey)}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </Group>
    </form>
  );
};

const FuncItemCard = (
  props: {
    item: FuncItem;
    onEditItem: (item: FuncItem) => void;
    onDeleteItem: (name: string) => void;
  },
) => {
  const authToken = useRecoilValue(tokenSelector);
  const openDeleteConfirm = (name: string) =>
    openConfirmModal({
      centered: true,
      title: "Delete",
      labels: { confirm: "Delete", cancel: "Cancel" },
      children: <Text>Delete {name}?</Text>,
      confirmProps: { color: "red" },
      onConfirm: () => props.onDeleteItem(name),
    });

  return (
    <Card withBorder radius="lg" sx={{ minWidth: 200 }}>
      <Card.Section withBorder inheritPadding py="xs">
        <Group position="apart">
          <Text weight={500}>{props.item.name}</Text>
          <Menu offset={0}>
            <Menu.Target>
              <ActionIcon>
                <Dots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                icon={<Edit size={14} />}
                onClick={() => props.onEditItem(props.item)}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                color="red"
                icon={<Trash size={14} />}
                onClick={() => openDeleteConfirm(props.item.name)}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Card.Section>
      <Text my="sm">
        {props.item.method}: {props.item.path}
      </Text>
      <Button
        color="orange"
        variant="light"
        fullWidth
        onClick={() => {
          let body = props.item.body;
          if (body && (body.startsWith("{") || body.startsWith("["))) {
            body = JSON.stringify(JSON.parse(body));
          }
          const notifyId = `notify${props.item.name}`;
          showNotification({
            id: notifyId,
            loading: true,
            title: `Execute ${props.item.path}`,
            message: "Loading...",
            autoClose: false,
            disallowClose: true,
          });
          const url = new URL(lsServer.get() ?? "");
          url.pathname = props.item.path;
          myFetch(url, {
            method: props.item.method,
            headers: { Authorization: `Bearer ${authToken}` },
            body,
          }).then(async (ret) => {
            if (!ret.ok) throw new Error(`${ret.status} ${ret.statusText}`);
            let json: any;
            try {
              json = await ret.json();
            } catch {
              return { body: ret.statusText, status: ret.status };
            }
            if (!Object.keys(json).includes("challenge")) {
              return { body: JSON.stringify(json), status: ret.status };
            }
            let waResult = "";
            try {
              waResult = JSON.stringify(await startAuthentication(json));
            } catch (err: any) {
              throw new Error(`WebAuthn error: ${err.message}`);
            }
            return myFetch(url, {
              method: props.item.method,
              headers: { Authorization: `Bearer ${authToken}` },
              body: waResult,
            }).then(async (ret) => {
              if (!ret.ok) throw new Error(`${ret.status} ${ret.statusText}`);
              try {
                return { body: await ret.text(), status: ret.status };
              } catch {
                return { body: ret.statusText, status: ret.status };
              }
            });
          }).then(({ body, status }) =>
            updateNotification({
              id: notifyId,
              title: `Success ${props.item.name} [${String(status)}]`,
              message: body,
              autoClose: false,
              disallowClose: false,
              color: "green",
              icon: <Check />,
            })
          ).catch((err: Error) =>
            updateNotification({
              id: notifyId,
              title: `Fetch failed ${props.item.name}`,
              message: err.message,
              autoClose: 5000,
              color: "red",
              icon: <X />,
            })
          );
        }}
      >
        Execute
      </Button>
    </Card>
  );
};

const APIPanel = () => {
  const [db, setDB] = useState<IDBDatabase | undefined>();
  const [funcs, setFuncs] = useState<FuncItem[]>([]);

  const sync = (db: IDBDatabase) => {
    const tx = db.transaction("funcitem");
    const req = tx.objectStore("funcitem").getAll();
    req.onsuccess = () => setFuncs(req.result);
  };

  const writeTransaction = (callback: (tx: IDBTransaction) => void) => {
    if (!db) {
      showNotification({ icon: <X />, color: "red", message: "DB init error" });
      return;
    }
    const tx = db.transaction("funcitem", "readwrite");
    tx.oncomplete = () => sync(db);
    callback(tx);
  };

  const putItem = (item: FuncItem) => {
    writeTransaction((tx) => tx.objectStore("funcitem").put(item));
  };

  const deleteItem = (name: string) =>
    writeTransaction((tx) => tx.objectStore("funcitem").delete(name));

  useEffect(() => {
    const openReq = indexedDB.open("APIFuncs", 1);
    openReq.onupgradeneeded = () => {
      const db = openReq.result;
      switch (db.version) {
        case 1: {
          db.createObjectStore("funcitem", { keyPath: "name" });
          break;
        }
      }
    };
    openReq.onsuccess = () => {
      const db = openReq.result;
      setDB(db);
      sync(db);
    };
    openReq.onerror = () => console.error("indexdb error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openFuncForm = (item?: FuncItem) => {
    const currentName = item?.name;
    openModal({
      modalId: "funcModal",
      title: item ? "Edit " + item?.name : "New",
      children: (
        <FuncItemForm
          closeKey="funcModal"
          onSave={(newItem) => {
            if (currentName && currentName !== newItem.name) {
              deleteItem(currentName);
            }
            putItem(newItem);
          }}
          {...(item ?? { name: "", path: "", method: "GET" })}
        />
      ),
    });
  };

  return (
    <Stack>
      <Group position="apart">
        <Title>API Panel</Title>
        <Tooltip label="New API">
          <ActionIcon
            color="indigo"
            size={40}
            variant="filled"
            onClick={() => openFuncForm()}
          >
            <MessagePlus />
          </ActionIcon>
        </Tooltip>
      </Group>
      {funcs.length === 0 ? <>None</> : (
        <SimpleGrid
          breakpoints={[
            { minWidth: "xs", cols: 1 },
            { minWidth: "sm", cols: 2 },
            { minWidth: "lg", cols: 3 },
            { minWidth: "xl", cols: 4 },
          ]}
        >
          {funcs.map((item) => (
            <FuncItemCard
              key={item.name}
              item={item}
              onEditItem={(item) => openFuncForm(item)}
              onDeleteItem={(name) => deleteItem(name)}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};

export default APIPanel;
