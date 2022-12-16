import {
  ActionIcon,
  Box,
  Button,
  Center,
  Divider,
  Group,
  NavLink,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Check, DeviceFloppy, Edit, Trash, X } from "tabler-icons-react";
import { appNameListSelector } from "../../recoil/atoms";
import { deleteApp, putAppName } from "../../EbinaAPI/app/app";
import { tokenSelector } from "../../recoil/user";
import { openConfirmModal } from "@mantine/modals";
import { getAPIStatus, updateAPIStatus } from "../../EbinaAPI/app/api";
import { useEffect, useMemo, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

const AppsEdit = () => {
  const authToken = useRecoilValue(tokenSelector);
  const navigate = useNavigate();
  const setAppNameList = useSetRecoilState(appNameListSelector);
  const [isEdit, editHalder] = useDisclosure(false);
  const [appName, setAppName] = useState(useParams().appName ?? "");
  const [appNameCache, setAppNameCache] = useState(appName);
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
          <Group position="apart">
            {isEdit
              ? (
                <>
                  <TextInput
                    w={220}
                    size="lg"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                  />
                  <Stack>
                    <ActionIcon
                      radius="xl"
                      onClick={() => {
                        setAppName(appNameCache);
                        editHalder.close();
                      }}
                    >
                      <X size={20} />
                    </ActionIcon>{" "}
                    <ActionIcon
                      radius="xl"
                      onClick={() => {
                        putAppName(authToken, appNameCache, appName)
                          .then(() => {
                            showNotification({
                              title: "App Name Change Success",
                              message: `${appNameCache} to ${appName}`,
                              color: "green",
                              icon: <Check />,
                            });
                            navigate(`../${appName}`, { replace: true });
                            setAppNameCache(appName);
                            editHalder.close();
                          }).catch((err: Error) => {
                            showNotification({
                              title: "App Name Change Failed",
                              message: err.message === "Not Found"
                                ? "Maybe your server is old version"
                                : err.message,
                              color: "red",
                              icon: <X />,
                            });
                          });
                      }}
                    >
                      <DeviceFloppy size={20} />
                    </ActionIcon>
                  </Stack>
                </>
              )
              : (
                <>
                  <Title w={220} order={2}>{appName}</Title>
                  <ActionIcon radius="xl" onClick={() => editHalder.open()}>
                    <Edit size={20} />
                  </ActionIcon>
                </>
              )}
          </Group>
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
