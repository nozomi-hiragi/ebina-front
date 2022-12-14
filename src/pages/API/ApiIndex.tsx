import { ReactNode, useEffect, useState } from "react";
import {
  ActionIcon,
  Affix,
  Box,
  Button,
  Center,
  Divider,
  Group,
  NavLink,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { closeModal, openModal } from "@mantine/modals";
import { Check, Plus, Refresh } from "tabler-icons-react";
import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { tokenSelector } from "../../recoil/user";
import {
  getAPIs,
  getAPIStatus,
  getPort,
  updateAPIStatus,
  updatePort,
} from "../../EbinaAPI/app/api";
import { getScriptList } from "../../EbinaAPI/app/script";
import ApiDetailForm from "./ApiDetailForm";

interface APIs {
  apis: { path: string; name: string }[];
  child: { [path: string]: APIs };
}

var cacheAppName = "";

const ApiIndex = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [apiState, setApiState] = useState<any>({});
  const [apis, setApis] = useState<APIs>({ apis: [], child: {} });
  const [refreshState, setRefreshState] = useState(true);
  const [port, setPort] = useState<number>(0);
  const appName = useParams().appName ?? "";
  const [filenameList, setFilenameList] = useState<string[]>([]);

  useEffect(() => {
    getScriptList(authToken, appName).then((ret) => setFilenameList(ret));
  }, [authToken, appName]);

  useEffect(() => {
    if (refreshState || cacheAppName !== appName) {
      getAPIStatus(authToken, appName).then((res) => {
        setApiState(res);
      });
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
      getPort(authToken, appName).then((res) => {
        setPort(res);
      });
      setRefreshState(false);
      cacheAppName = appName;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshState, appName]);

  let labelStartButton: string = "";
  let labelStatus: string = "";
  switch (apiState.status) {
    case "started":
      labelStatus = "Runging";
      labelStartButton = "Restart";
      break;
    case "stop":
      labelStatus = "Stop";
      labelStartButton = "Start";
      break;
    default:
      break;
  }

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
      <Group position="center">
        <Center inline>
          <Paper withBorder p="sm">
            <Title order={5}>Status</Title>
            <Group position="apart">
              <Tooltip
                label={`at ${(new Date(apiState.started_at)).toLocaleString()}`}
                position="bottom"
                disabled={!apiState.started_at}
              >
                <Text>{labelStatus}</Text>
              </Tooltip>
              <Group>
                <Button
                  onClick={() =>
                    updateAPIStatus(authToken, appName, "start")
                      .then(() => setRefreshState(true))}
                >
                  {labelStartButton}
                </Button>
                <Button
                  onClick={() =>
                    updateAPIStatus(authToken, appName, "stop")
                      .then(() => setRefreshState(true))}
                >
                  Stop
                </Button>
              </Group>
            </Group>
          </Paper>
        </Center>
        <Center inline>
          <Paper withBorder p="sm">
            <Title order={5}>Port</Title>
            <Group align="center">
              <NumberInput
                w={100}
                label="Port"
                placeholder="3456"
                value={port}
                onChange={(v) => v && setPort(v)}
              />
              <Button
                onClick={() =>
                  updatePort(authToken, appName, port)
                    .then(() => setRefreshState(true))}
              >
                Save
              </Button>
            </Group>
          </Paper>
        </Center>
      </Group>
      <Divider />
      <Title order={5}>API List</Title>
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
