import {
  Button,
  Checkbox,
  Container,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Check } from "tabler-icons-react";
import { appNameSelector } from "../../atoms";
import EbinaAPI, { CronItem } from "../../EbinaAPI";

const ConstanRunDetail = () => {
  const paramCronName = useParams().cronName ?? "new";
  const isNew = paramCronName === "new";
  const [newCronName, setNewCronName] = useState<string>(paramCronName);
  const appName = useRecoilValue(appNameSelector);
  const [pending, setPending] = useState<boolean>(!isNew);
  const [scriptNames, setScriptNames] = useState<string[]>([]);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const navigate = useNavigate();

  const cronEditForm = useForm({
    initialValues: {
      enable: false,
      pattern: "",
      fileName: "",
      funcName: "",
    },
    validate: {},
  });

  useEffect(() => {
    if (!isNew) {
      EbinaAPI.getCron(appName, paramCronName ?? "").then((ret) => {
        const args = ret.function.split(">");
        cronEditForm.setValues({
          ...ret,
          fileName: args[0],
          funcName: args[1],
        });
        setPending(false);
      });
    }
    EbinaAPI.getScriptList(appName).then((ret) => {
      setScriptNames(ret);
    });
    // eslint-disable-next-line
  }, [setPending]);

  return (
    <Container>
      <Stack>
        <Title order={3}>{`${appName}/${paramCronName}`}</Title>
        <form
          onSubmit={cronEditForm.onSubmit((value) => {
            setPending(true);
            const item: CronItem = {
              enable: value.enable,
              pattern: value.pattern,
              function: `${value.fileName}>${value.funcName}`,
            };
            const p = isNew
              ? EbinaAPI.createCron(
                appName,
                newCronName ?? "",
                item,
              )
              : EbinaAPI.updateCron(
                appName,
                newCronName ?? "",
                item,
              );
            p.then(() => {
              showNotification({
                message: "Save successful",
                icon: <Check size={16} />,
                color: "green",
              });
              if (isNew) navigate("../");
            }).catch((err) => {
              showNotification({
                title: "Save failed",
                message: JSON.stringify(err),
                color: "red",
              });
              console.error(err);
            }).finally(() => setPending(false));
          })}
        >
          <Stack>
            {isNew && (
              <TextInput
                label="Name"
                disabled={pending}
                onChange={(element) => {
                  setNewCronName(element.currentTarget.value);
                }}
              />
            )}
            <Checkbox
              label="Enable"
              disabled={pending}
              {...cronEditForm.getInputProps("enable", { type: "checkbox" })}
            />
            <TextInput
              label="Pattern"
              disabled={pending}
              {...cronEditForm.getInputProps("pattern")}
            />
            <Select
              label="Script"
              placeholder="Pick one"
              disabled={pending}
              data={scriptNames}
              {...cronEditForm.getInputProps("fileName")}
            />
            <TextInput
              label="Function"
              disabled={pending}
              {...cronEditForm.getInputProps("funcName")}
            />
            <Group position="right" pt="xs">
              {!isNew && (
                <Button
                  disabled={pending}
                  onClick={() => setOpenDeleteModal(true)}
                >
                  Delete
                </Button>
              )}
              <Button type="submit" disabled={pending}>Save</Button>
            </Group>
          </Stack>
        </form>
      </Stack>
      <Modal
        opened={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        title={`Delete ${paramCronName}?`}
      >
        <Group position="right">
          <Button onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
          <Button
            onClick={() => {
              EbinaAPI.deleteCron(appName, paramCronName).then(() => {
                navigate("../");
              }).catch((err) =>
                showNotification({
                  title: "Delete failed",
                  message: JSON.stringify(err),
                  color: "red",
                })
              );
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default ConstanRunDetail;
