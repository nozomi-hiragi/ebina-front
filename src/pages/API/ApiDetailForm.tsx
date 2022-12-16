import {
  ActionIcon,
  Button,
  Group,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { DeviceFloppy, Refresh, Trash, X } from "tabler-icons-react";
import { deleteAPI, getAPI, updateAPI } from "../../EbinaAPI/app/api";
import { tokenSelector } from "../../recoil/user";
import { ApiMethodList, TypeApiMethods, TypeApiTypes } from "../../types/types";

interface APIValues {
  [key: string]: any;
  version: number;
  path: string;
  name: string;
  method: TypeApiMethods;
  type: TypeApiTypes;
  filename?: string;
  value: string;
}

interface APIDetailFormProps {
  appName: string;
  path?: string;
  filenameList: string[];
  onSave?: (values: APIValues) => void;
  onDelete?: () => void;
}

export const ApiDetailForm = (
  { appName, path = "", filenameList, onSave, onDelete }: APIDetailFormProps,
) => {
  const authToken = useRecoilValue(tokenSelector);
  const [curPath, setcurPath] = useState(path);
  const isNew = useMemo(() => curPath === "", [curPath]);
  const initialValues: APIValues = {
    version: isNew ? 2 : 0,
    path,
    name: "",
    method: "get",
    type: "static",
    value: "",
  };
  const [isEditing, setIsEditing] = useState(false);
  const [valuesCache, setValuesCache] = useState<APIValues>(initialValues);
  const editApiForm = useForm<APIValues>({ initialValues });

  const isTypeScript = useMemo(() => editApiForm.values.type === "JavaScript", [
    editApiForm.values.type,
  ]);

  useEffect(() => {
    if (isNew) return;
    getAPI(authToken, appName, curPath).then((api) => {
      const values: APIValues = { version: 1, ...api };
      if (values.version === 2) {
        values.type = api.filename ? "JavaScript" : "static";
      } else {
        if (values.type === "JavaScript") {
          const args = api.value.split(">");
          values.filename = args[0];
          values.value = args[1];
        }
      }
      editApiForm.setValues(values);
      setValuesCache(values);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curPath, authToken, appName]);

  useEffect(() => {
    if (isEditing) return;
    if (!isNew && valuesCache.version === 0) return;
    const diff = Object.keys(valuesCache)
      .find((k) => valuesCache[k] !== editApiForm.values[k]);
    if (!diff) return;
    setIsEditing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editApiForm.values]);

  const openDeleteModal = () =>
    openConfirmModal({
      title: "Delete API",
      centered: true,
      children: <Text color="red">Delete "{editApiForm.values.name}"?</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        deleteAPI(authToken, appName, curPath).then(onDelete).catch((err) =>
          showNotification({
            title: "Delete API Error",
            message: err,
            color: "red",
            icon: <X />,
          })
        ),
    });

  return (
    <form
      onSubmit={editApiForm.onSubmit((values) => {
        if (values.type === "JavaScript") {
          if (values.version === 1) {
            values.value = `${values.filename}>${values.value}`;
            values.filename = "";
          }
        } else {
          values.filename = "";
        }
        const path = isNew ? values.path : curPath;
        updateAPI(authToken, appName, path, values).then(() => {
          setcurPath(values.path);
          setValuesCache(values);
          setIsEditing(false);
          onSave && onSave(values);
        }).catch((err: Error) =>
          showNotification({
            title: "Update API Error",
            message: err.toString(),
            color: "red",
            icon: <X />,
          })
        );
      })}
    >
      <Group position="apart">
        <TextInput
          w={220}
          placeholder="Name"
          required
          label={isNew ? "Name" : undefined}
          mt={isNew ? "sm" : undefined}
          variant={isNew ? undefined : "unstyled"}
          size={isNew ? undefined : "xl"}
          {...editApiForm.getInputProps("name")}
        />
        {!isNew && (
          <ActionIcon title="Delete" color="red" onClick={openDeleteModal}>
            <Trash />
          </ActionIcon>
        )}
      </Group>
      <Stack>
        <TextInput
          label="Path"
          placeholder="Path"
          required
          {...editApiForm.getInputProps("path")}
        />
        <SegmentedControl
          data={ApiMethodList}
          {...editApiForm.getInputProps("method")}
        />
        <SegmentedControl
          data={[
            { label: "Static Value", value: "static" },
            { label: "Script", value: "JavaScript" },
          ]}
          {...editApiForm.getInputProps("type")}
        />
        {isTypeScript
          ? (
            <Group position="apart" grow mb={8}>
              <Select
                label="Filename"
                placeholder="Pick one"
                data={filenameList}
                required
                miw={122}
                {...editApiForm.getInputProps("filename")}
              />
              <TextInput
                label={"Function"}
                placeholder="Value"
                required
                miw={122}
                {...editApiForm.getInputProps("value")}
              />
            </Group>
          )
          : (
            <Textarea
              label={"Value"}
              placeholder="Value"
              required
              autosize
              {...editApiForm.getInputProps("value")}
            />
          )}
        <Group position="right" mt="md">
          {isEditing && (
            <Button
              leftIcon={<Refresh size={20} />}
              variant="default"
              onClick={() => {
                editApiForm.setValues(valuesCache);
                setIsEditing(false);
              }}
            >
              Reset
            </Button>
          )}
          <Button
            leftIcon={<DeviceFloppy size={20} />}
            type="submit"
            disabled={!isEditing}
          >
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default ApiDetailForm;
