import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Container,
  Group,
  Modal,
  Select,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  ApiMethodList,
  ApiTypeList,
  TypeApiMethods,
  TypeApiTypes,
} from "../../types";
import { createPath, deleteAPI, getAPI, updateAPI } from "../../EbinaAPI/app/api";
import { tokenSelector } from "../../recoil/user";
import { useRecoilValue } from "recoil";
import { getScriptList } from "../../EbinaAPI/app/script";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const ApiEdit = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jsList, setJsList] = useState<string[]>([]);
  const appName = useParams().appName ?? "";
  const navigate = useNavigate();

  const query = useQuery();
  const queryPath = query.get("path");

  useEffect(() => {
    getScriptList(authToken, appName).then((ret) => setJsList(ret));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (queryPath) {
      getAPI(authToken, appName, queryPath).then((api) => {
        switch (api.type) {
          case "JavaScript":
            const args = api.value.split(">");
            editApiForm.setFieldValue("jsfilename", args[0]);
            editApiForm.setFieldValue("jsfunction", args[1]);
            break;
        }
        editApiForm.setFieldValue("path", queryPath);
        editApiForm.setFieldValue("name", api.name);
        editApiForm.setFieldValue("method", api.method);
        editApiForm.setFieldValue("type", api.type);
        editApiForm.setFieldValue("value", api.value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPath]);

  const editApiForm = useForm({
    initialValues: {
      path: queryPath ?? "",
      name: "",
      method: "get" as TypeApiMethods,
      type: "static" as TypeApiTypes,
      value: "",
      jsfilename: "",
      jsfunction: "",
    },
  });

  return (
    <Container m={1}>
      <form
        onSubmit={editApiForm.onSubmit((values) => {
          switch (values.type) {
            case "JavaScript":
              values.value = `${values.jsfilename}>${values.jsfunction}`;
              break;
          }
          if (queryPath) {
            updateAPI(authToken, appName, values.path, values).then(() => {
              navigate(-1);
            });
          } else {
            createPath(authToken, appName, values.path, values).then(() => {
              navigate(-1);
            });
          }
        })}
      >
        <TextInput
          label="Path"
          placeholder="Path"
          required={queryPath == null}
          disabled={queryPath !== null}
          {...editApiForm.getInputProps("path")}
        />
        <TextInput
          label="Name"
          placeholder="Name"
          required
          {...editApiForm.getInputProps("name")}
        />
        <Select
          label="Method"
          placeholder="Pick one"
          data={ApiMethodList}
          {...editApiForm.getInputProps("method")}
        />
        <Select
          label="Type"
          placeholder="Pick one"
          data={ApiTypeList}
          {...editApiForm.getInputProps("type")}
        />
        {editApiForm.values.type === "JavaScript"
          ? (
            <>
              <Select
                label="JsFile"
                placeholder="Pick one"
                data={jsList}
                required={editApiForm.values.type === "JavaScript"}
                {...editApiForm.getInputProps("jsfilename")}
              />
              <TextInput
                label="Function"
                placeholder="Function"
                required={editApiForm.values.type === "JavaScript"}
                {...editApiForm.getInputProps("jsfunction")}
              />
            </>
          )
          : (
            <TextInput
              label="Value"
              placeholder="Value"
              required={editApiForm.values.type === "static"}
              {...editApiForm.getInputProps("value")}
            />
          )}
        <Group position="right" mt="md">
          <Button
            disabled={queryPath === null}
            onClick={() => {
              setDeleteDialogOpen(true);
            }}
          >
            Delete
          </Button>
          <Button type="submit">Save</Button>
        </Group>
      </form>
      <Modal
        opened={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={`Delete ${appName} API`}
      >
        <Text color="red">{`Delete "${queryPath}"?`}</Text>
        <Group position="right">
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              deleteAPI(authToken, appName, queryPath!).then(() => {
                setDeleteDialogOpen(false);
                navigate(-1);
              }).catch((err) => {
                console.log(err);
              });
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default ApiEdit;
