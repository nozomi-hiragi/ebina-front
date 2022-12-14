import { useEffect, useState } from "react";
import {
  ActionIcon,
  Affix,
  Button,
  Center,
  Divider,
  Group,
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

var cacheAppName = "";

const ApiIndex = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [apiState, setApiState] = useState<any>({});
  const [apis, setApis] = useState<{ path: string; name: string }[]>([]);
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
        if ("version" in res) setApis(res.apis);
        else setApis(res.map((it) => ({ path: it.path, name: it.api.name })));
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
      <Title order={5}>
        API List
      </Title>
      <SimpleGrid
        breakpoints={[
          { minWidth: "xs", cols: 1 },
          { minWidth: 790, cols: 2 },
          { minWidth: "lg", cols: 3 },
        ]}
      >
        {apis.map((api) => (
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
      <Affix position={{ bottom: 20, right: 20 }}>
        <Button w={50} h={50} p={0} radius="xl" onClick={openNewAPIModal}>
          <Plus />
        </Button>
      </Affix>
    </Stack>
  );
};

export default ApiIndex;
