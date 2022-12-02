import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import { Trash } from "tabler-icons-react";
import { NginxConf } from "../../EbinaAPI";
import {
  deleteRoute,
  getRoute,
  getRouteList,
  getRoutingStatus,
  newRoute,
  setRoute,
  updateRouter,
} from "../../EbinaAPI/routing";
import { tokenSelector } from "../../recoil/user";

const Routing = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [routeParams, setRouteParams] = useState<
    { [name: string]: NginxConf | undefined }
  >({});
  const [currentHostname, setCurrentHostname] = useState<string>("");
  const [currentPort, setCurrentPort] = useState<number | "koujou">(0);
  const [newDialog, newDialogHandler] = useDisclosure(false);
  const [newRouteName, setNewRouteName] = useState<string>("");
  const [accordionValue, setAccordionValue] = useState<string | null>(null);
  const [deleteRouteName, setDeleteRouteName] = useState<string>("");
  const [routerStatus, setRouterStatus] = useState<string>("Unknown");
  const [isRouterEnable, routerEnableHandler] = useDisclosure(false);

  useEffect(() => {
    if (Object.keys(routeParams).length === 0) {
      getRouteList(authToken).then((list) => {
        const params: { [name: string]: NginxConf | undefined } = {};
        list.forEach((name) => params[name] = undefined);
        setRouteParams(params);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getRoutingStatus(authToken).then((ret) => {
      if (ret !== "Disable") routerEnableHandler.open();
      setRouterStatus(ret);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerStatus]);

  return (
    <Container>
      <Container>
        <Group mb="md" position="apart">
          <Text>Status: {routerStatus}</Text>
          <Button onClick={() => setRouterStatus("Refreshing...")}>
            Refresh
          </Button>
        </Group>
        {isRouterEnable && (
          <Group mb="md" position="apart">
            {routerStatus === "Removed"
              ? (
                <Button
                  onClick={() =>
                    updateRouter(authToken, "up")
                      .then(() => setRouterStatus("Refreshing..."))}
                >
                  Up
                </Button>
              )
              : (
                <>
                  <Button
                    onClick={() =>
                      updateRouter(authToken, "rm")
                        .then(() => setRouterStatus("Refreshing..."))}
                  >
                    Remove
                  </Button>
                  <Button
                    onClick={() =>
                      updateRouter(authToken, "restart")
                        .then(() => setRouterStatus("Refreshing..."))}
                  >
                    Restart
                  </Button>
                </>
              )}
          </Group>
        )}
      </Container>
      <Group grow mb="md">
        <Button
          onClick={() => {
            newDialogHandler.open();
            setAccordionValue(null);
            setCurrentHostname("");
            setCurrentPort(0);
          }}
        >
          New
        </Button>
      </Group>
      <Accordion
        variant="separated"
        value={accordionValue}
        sx={{ maxWidth: 300, width: 300 }}
        onChange={(value) => {
          setAccordionValue(value);
          if (!value) return;
          if (!routeParams[value]) {
            getRoute(authToken, value).then((conf) => {
              const newValue: { [name: string]: NginxConf | undefined } = {};
              newValue[value] = conf;
              setRouteParams({ ...routeParams, ...newValue });
              setCurrentHostname(conf.hostname);
              setCurrentPort(conf.port);
            });
          } else {
            setCurrentHostname(routeParams[value]?.hostname ?? "");
            setCurrentPort(routeParams[value]?.port ?? 0);
          }
        }}
      >
        {Object.keys(routeParams).map((route) => {
          return (
            <Accordion.Item key={route} value={route}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Accordion.Control>
                  {route}
                </Accordion.Control>
                <ActionIcon size="lg" onClick={() => setDeleteRouteName(route)}>
                  <Trash size={20} />
                </ActionIcon>
              </Box>
              <Accordion.Panel>
                <TextInput
                  label="Hostname"
                  placeholder="example.com"
                  value={currentHostname}
                  onChange={(event) =>
                    setCurrentHostname(event.currentTarget.value)}
                />
                {Number.isInteger(currentPort)
                  ? (
                    <NumberInput
                      label="Port"
                      placeholder="3456"
                      value={currentPort as number}
                      onChange={(value) => setCurrentPort(value ?? 0)}
                    />
                  )
                  : <TextInput label="Port" value={currentPort} disabled />}
                <Group position="right" mt="md">
                  <Button
                    onClick={() => {
                      const port = routeParams[route]?.port ?? 0;
                      setCurrentHostname(routeParams[route]?.hostname ?? "");
                      setCurrentPort(port === "koujou" ? 0 : port);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => {
                      const newConf: NginxConf = {
                        hostname: currentHostname,
                        port: currentPort,
                        www: routeParams[route]?.www,
                      };
                      setRoute(authToken, route, newConf).then((ret) => {
                        if (ret) {
                          const newValue: {
                            [name: string]: NginxConf | undefined;
                          } = {};
                          newValue[route] = newConf;
                          setRouteParams({ ...routeParams, ...newValue });
                        }
                      });
                    }}
                  >
                    Save
                  </Button>
                </Group>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
      <Modal
        opened={newDialog}
        onClose={() => newDialogHandler.close()}
        title="New Route"
      >
        <TextInput
          label="Name"
          placeholder=""
          value={newRouteName}
          onChange={(event) => setNewRouteName(event.currentTarget.value)}
        />
        <TextInput
          label="Hostname"
          placeholder="example.com"
          value={currentHostname}
          onChange={(event) => setCurrentHostname(event.currentTarget.value)}
        />
        {Number.isInteger(currentPort)
          ? (
            <NumberInput
              label="Port"
              placeholder="3456"
              value={currentPort === "koujou" ? 0 : currentPort}
              onChange={(value) => setCurrentPort(value ?? 0)}
            />
          )
          : <TextInput label="Port" value={currentPort} disabled />}
        <Switch
          label="Port for Koujou"
          mt="sm"
          onChange={(e) =>
            setCurrentPort(e.currentTarget.checked ? "koujou" : 0)}
        />
        <Group position="right" mt="md">
          <Button onClick={() => newDialogHandler.close()}>Cancel</Button>
          <Button
            onClick={() => {
              const newConf: NginxConf = {
                hostname: currentHostname,
                port: currentPort,
              };
              newRoute(authToken, newRouteName, newConf).then((ret) => {
                if (ret) {
                  const newValue: { [name: string]: NginxConf | undefined } =
                    {};
                  newValue[newRouteName] = newConf;
                  setRouteParams({ ...routeParams, ...newValue });
                  newDialogHandler.close();
                } else {
                  alert("already");
                }
              }).catch((err) => {
                alert(err);
              });
            }}
          >
            Save
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={deleteRouteName !== ""}
        onClose={() => setDeleteRouteName("")}
        title="Delete Route"
      >
        {deleteRouteName !== "" &&
          <Text size="xl" color="red">Delete "{deleteRouteName}"?</Text>}
        <Group position="right">
          <Button onClick={() => setDeleteRouteName("")}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              deleteRoute(authToken, deleteRouteName).then(() => {
                const newParams = routeParams;
                delete newParams[deleteRouteName];
                setRouteParams(newParams);
                setDeleteRouteName("");
              }).catch((err) => {
                setDeleteRouteName("");
                alert(err);
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

export default Routing;
