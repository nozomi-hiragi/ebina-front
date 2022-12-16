import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Affix,
  Box,
  Button,
  Center,
  Divider,
  Group,
  NavLink,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { closeModal, openModal } from "@mantine/modals";
import { Check, Plus, Refresh, X } from "tabler-icons-react";
import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { tokenSelector } from "../../recoil/user";
import { getAPIs } from "../../EbinaAPI/app/api";
import { getScriptList } from "../../EbinaAPI/app/script";
import ApiDetailForm from "./ApiDetailForm";
import { getFinal, getInit, putFinal, putInit } from "../../EbinaAPI/app/app";

interface APIs {
  apis: { path: string; name: string }[];
  child: { [path: string]: APIs };
}

interface ProcessItem {
  [key: string]: any;
  initFilename: string;
  initFunction: string;
  finalFilename: string;
  finalFunction: string;
}

const ProcessFunctions = (
  { appName, filenameList }: { appName: string; filenameList: string[] },
) => {
  const authToken = useRecoilValue(tokenSelector);
  const initialValues: ProcessItem = {
    initFilename: "",
    initFunction: "",
    finalFilename: "",
    finalFunction: "",
  };
  const [processCache, setProcessCache] = useState(initialValues);
  const processFuncsForm = useForm({
    initialValues,
    validate: {
      initFunction: (value, values) =>
        (value && !values.initFilename) || (!value && values.initFilename)
          ? "Input function or clear filename"
          : null,
      finalFunction: (value, values) =>
        (value && !values.finalFilename) || (!value && values.finalFilename)
          ? "Input function or clear filename"
          : null,
    },
  });
  const isEditInit = useMemo(
    () =>
      (processCache.initFilename !== processFuncsForm.values.initFilename) ||
      (processCache.initFunction !== processFuncsForm.values.initFunction),
    [processCache, processFuncsForm.values],
  );
  const isEditFinal = useMemo(
    () =>
      (processCache.finalFilename !== processFuncsForm.values.finalFilename) ||
      (processCache.finalFunction !== processFuncsForm.values.finalFunction),
    [processCache, processFuncsForm.values],
  );
  const isEditing = useMemo(
    () => isEditInit || isEditFinal,
    [isEditInit, isEditFinal],
  );
  const [isSupport, setIsSupport] = useState(false); // @TODO 互換用 消す

  useEffect(() => {
    Promise.all([
      getInit(authToken, appName).then((values) => ({
        initFilename: values?.filename ?? "",
        initFunction: values?.function ?? "",
      })),
      getFinal(authToken, appName).then((values) => ({
        finalFilename: values?.filename ?? "",
        finalFunction: values?.function ?? "",
      })),
    ]).then((res) => {
      setIsSupport(true);
      const values = { ...res[0], ...res[1] };
      processFuncsForm.setValues(values);
      setProcessCache(values);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, appName]);

  if (!isSupport) return <></>;

  return (
    <Paper withBorder maw={424} p={10}>
      <form
        onSubmit={processFuncsForm.onSubmit((values) => {
          const promises = [];
          if (isEditInit) {
            promises.push(putInit(authToken, appName, {
              filename: values.initFilename,
              function: values.initFunction,
            }));
          }
          if (isEditFinal) {
            promises.push(putFinal(authToken, appName, {
              filename: values.finalFilename,
              function: values.finalFunction,
            }));
          }
          Promise.all(promises).then(() => {
            setProcessCache(values);
            showNotification({
              title: "Update Process Function Success",
              message: "Saved",
              color: "green",
              icon: <Check />,
            });
          }).catch((err: Error) =>
            showNotification({
              title: "Update Process Function Failed",
              message: err.toString(),
              color: "red",
              icon: <X />,
            })
          );
        })}
      >
        <Stack>
          <Title order={3}>Process Functions</Title>
          <Box>
            <Title order={3}>Initialize</Title>
            <Group position="apart" grow>
              <Select
                label="Filename"
                placeholder="Pick one"
                clearable
                data={filenameList}
                miw={122}
                {...processFuncsForm.getInputProps("initFilename")}
              />
              <TextInput
                label={"Function"}
                placeholder="Value"
                miw={122}
                {...processFuncsForm.getInputProps("initFunction")}
              />
            </Group>
          </Box>
          <Box>
            <Title order={3}>Finalize</Title>
            <Group position="apart" grow>
              <Select
                label="Filename"
                placeholder="Pick one"
                clearable
                data={filenameList}
                miw={122}
                {...processFuncsForm.getInputProps("finalFilename")}
              />
              <TextInput
                label={"Function"}
                placeholder="Value"
                miw={122}
                {...processFuncsForm.getInputProps("finalFunction")}
              />
            </Group>
          </Box>
          <Group position="right">
            <Button
              variant="default"
              disabled={!isEditing}
              onClick={() => processFuncsForm.setValues(processCache)}
            >
              Reset
            </Button>
            <Button type="submit" disabled={!isEditing}>Save</Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
};

const ApiIndex = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [apis, setApis] = useState<APIs>({ apis: [], child: {} });
  const [refreshState, setRefreshState] = useState(true);
  const appName = useParams().appName ?? "";
  const [filenameList, setFilenameList] = useState<string[]>([]);

  useEffect(() => {
    getScriptList(authToken, appName).then((ret) => setFilenameList(ret));
  }, [authToken, appName]);

  useEffect(() => {
    if (!refreshState) return;
    getAPIs(authToken, appName).then((res) => {
      if ("version" in res) {
        const apis: APIs = { apis: [], child: {} };
        res.apis.forEach((api) => {
          const pathArray = api.path.split("/");
          pathArray.pop();
          let current: APIs = apis;
          for (const path of pathArray) {
            if (!current.child[path]) {
              current.child[path] = { apis: [], child: {} };
            }
            current = current.child[path];
          }
          current.apis.push(api);
        });
        setApis(apis);
      } else {
        setApis({
          apis: res.map((it) => ({ path: it.path, name: it.api.name })),
          child: {},
        });
      }
    });
    setRefreshState(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshState, appName]);

  const openNewAPIModal = () => {
    const modalId = "newapimodal";
    openModal({
      modalId,
      title: "New API",
      centered: true,
      children: (
        <ApiDetailForm
          appName={appName}
          filenameList={filenameList}
          onSave={() => {
            closeModal(modalId);
            setRefreshState(true);
          }}
        />
      ),
    });
  };

  const APIsComponent = (names: APIs, title: string = ""): ReactNode => {
    return (
      <Box>
        {title && <Title order={5} my={10}>{title}</Title>}
        <SimpleGrid
          my={10}
          breakpoints={[
            { minWidth: "xs", cols: 1 },
            { minWidth: 790, cols: 2 },
            { minWidth: "lg", cols: 3 },
          ]}
        >
          {names.apis.map((api) => (
            <Center key={api.name} inline>
              <Paper withBorder px="sm" pb="sm" w={424}>
                <ApiDetailForm
                  appName={appName}
                  path={api.path}
                  filenameList={filenameList}
                  onSave={(item) =>
                    showNotification({
                      title: "Save Success",
                      message: `${item.name} is saved`,
                      color: "green",
                      icon: <Check />,
                    })}
                  onDelete={() => setRefreshState(true)}
                />
              </Paper>
            </Center>
          ))}
        </SimpleGrid>
        {Object.keys(names.child).map((name) => {
          const label = `${title}${name}/`;
          return (
            <NavLink
              key={name}
              label={label}
              active
              color="indigo"
              variant="filled"
              childrenOffset={0}
            >
              {APIsComponent(names.child[name], label)}
            </NavLink>
          );
        })}
      </Box>
    );
  };

  return (
    <Stack mb={80}>
      <Group position="apart">
        <Text size="xl" weight={50}>API</Text>
        <ActionIcon
          size="xl"
          radius="xl"
          onClick={() => setRefreshState(true)}
        >
          <Refresh />
        </ActionIcon>
      </Group>
      <ProcessFunctions appName={appName} filenameList={filenameList} />
      <Divider />
      {APIsComponent(apis)}
      <Affix position={{ bottom: 20, right: 20 }}>
        <Button w={50} h={50} p={0} radius="xl" onClick={openNewAPIModal}>
          <Plus />
        </Button>
      </Affix>
    </Stack>
  );
};

export default ApiIndex;
