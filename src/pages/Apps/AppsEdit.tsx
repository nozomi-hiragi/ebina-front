import {
  Box,
  Button,
  Center,
  Divider,
  Group,
  NavLink,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Trash } from "tabler-icons-react";
import { appNameListSelector } from "../../recoil/atoms";
import { deleteApp } from "../../EbinaAPI/app/app";
import { tokenSelector } from "../../recoil/user";
import { openConfirmModal } from "@mantine/modals";
import { getAPIStatus, updateAPIStatus } from "../../EbinaAPI/app/api";
import { useEffect, useMemo, useState } from "react";

const AppsEdit = () => {
  const authToken = useRecoilValue(tokenSelector);
  const navigate = useNavigate();
  const setAppNameList = useSetRecoilState(appNameListSelector);
  const appName = useParams().appName;

  const [apiState, setApiState] = useState<any>({});
  const stateText = useMemo(() => {
    switch (apiState.status) {
      case "started":
        return { status: "Runging", buttonLabel: "Restart" };
      case "stop":
        return { status: "Stop", buttonLabel: "Start" };
      default:
        return { status: "", buttonLabel: "" };
    }
  }, [apiState.status]);
  const [refreshState, setRefreshState] = useState(true);
  useEffect(() => {
    if (!refreshState) return;
    setRefreshState(false);
    if (!appName) return;
    getAPIStatus(authToken, appName).then((res) => setApiState(res));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshState, authToken]);

  if (!appName) return <>404</>;

  const openDeleteModal = () =>
    openConfirmModal({
      title: "Delete App",
      centered: true,
      children: <Text color="red">{`Delete "${appName}"?`}</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        deleteApp(authToken, appName).then(() => {
          setAppNameList([]);
          navigate("/dashboard/apps");
        }).catch((err) => console.log(err)),
    });

  return (
    <Center>
      <Paper withBorder>
        <Stack m={10}>
          <Title order={2}>{appName}</Title>
          <Box>
            <Title order={5}>Status</Title>
            <Group position="apart" w={250}>
              <Tooltip
                label={`at ${(new Date(apiState.started_at)).toLocaleString()}`}
                position="bottom"
                disabled={!apiState.started_at}
              >
                <Text>{stateText.status}</Text>
              </Tooltip>
              <Group>
                <Button
                  onClick={() =>
                    updateAPIStatus(authToken, appName, "start")
                      .then(() => setRefreshState(true))}
                >
                  {stateText.buttonLabel}
                </Button>
                <Button
                  disabled={apiState.status === "stop"}
                  onClick={() =>
                    updateAPIStatus(authToken, appName, "stop")
                      .then(() => setRefreshState(true))}
                >
                  Stop
                </Button>
              </Group>
            </Group>
          </Box>
        </Stack>
        <Divider />
        <NavLink label="API" component={Link} to="api" />
        <NavLink label="Edit" component={Link} to="edit" />
        <NavLink label="Constant Run" component={Link} to="constantrun" />
        <NavLink label="Delete" icon={<Trash />} onClick={openDeleteModal} />
      </Paper>
    </Center>
  );
};

export default AppsEdit;
