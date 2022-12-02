import { useEffect, useState } from "react";
import {
  ActionIcon,
  Affix,
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  Stack,
  Text,
  Title,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { Plus, Refresh } from "tabler-icons-react";
import { Link, useParams } from "react-router-dom";
import {
  getAPIs,
  getAPIStatus,
  getPort,
  updateAPIStatus,
  updatePort,
} from "../../EbinaAPI/app/api";
import { useRecoilValue } from "recoil";
import { tokenSelector } from "../../recoil/user";

var cacheAppName = "";

const ApiIndex = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [apiState, setApiState] = useState<any>({});
  const [apis, setApisState] = useState<any[]>([]);
  const [refreshState, setRefreshState] = useState(true);
  const [port, setPort] = useState<number>(0);
  const appName = useParams().appName ?? "";

  useEffect(() => {
    if (refreshState || cacheAppName !== appName) {
      getAPIStatus(authToken, appName).then((res) => {
        setApiState(res);
      });
      getAPIs(authToken, appName).then((res) => {
        setApisState(res);
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
  return (
    <Container p={0}>
      <Container
        sx={{
          height: 70,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        fluid
      >
        <Text size="xl" weight={50}>API</Text>
        <ActionIcon
          size="xl"
          radius="xl"
          onClick={() => {
            setRefreshState(true);
          }}
        >
          <Refresh />
        </ActionIcon>
      </Container>
      <Divider />
      <Stack>
        <Title order={5}>
          Status
        </Title>
        <Group position="apart">
          <Tooltip
            label={`at ${(new Date(apiState.started_at)).toLocaleString()}`}
            position="bottom"
            disabled={!apiState.started_at}
          >
            <Text>
              {labelStatus}
            </Text>
          </Tooltip>
          <Group>
            <Button
              onClick={() =>
                updateAPIStatus(authToken, appName, "start").then(() =>
                  setRefreshState(true)
                )}
            >
              {labelStartButton}
            </Button>
            <Button
              onClick={() =>
                updateAPIStatus(authToken, appName, "stop").then(() =>
                  setRefreshState(true)
                )}
            >
              Stop
            </Button>
          </Group>
        </Group>
        <Divider />
        <Title order={5}>
          Port
        </Title>
        <Group align="center" position="apart">
          <NumberInput
            label="Port"
            placeholder="3456"
            value={port}
            onChange={(v) => {
              v && setPort(v);
            }}
          />
          <Button
            onClick={() =>
              updatePort(authToken, appName, port)
                .then(() => setRefreshState(true))}
          >
            Save
          </Button>
        </Group>
        <Divider />
        <Title order={5}>
          API List
        </Title>
        {apis.map((item) => (
          <UnstyledButton
            key={item.path}
            component={Link}
            to={`edit?path=${item.path}`}
          >
            <Divider />
            <Text>
              {item.api.name}
            </Text>
            <Text>
              {item.path}
            </Text>
          </UnstyledButton>
        ))}
      </Stack>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Button
          sx={{ width: 50, height: 50 }}
          p={0}
          radius="xl"
          component={Link}
          to="edit"
        >
          <Plus />
        </Button>
      </Affix>
    </Container>
  );
};

export default ApiIndex;
