import {
  Accordion,
  Button,
  Container,
  Group,
  Paper,
  Select,
  SelectItem,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { Check, X } from "tabler-icons-react";
import {
  getPorts,
  getRouteList,
  getRoutingStatus,
  setPort,
  updateRouter,
} from "../../EbinaAPI/routing";
import { tokenSelector } from "../../recoil/user";
import NewRouteForm from "./NewRouteForm";
import RouteDetail from "./RouteDetail";

const AppPort = (
  { name, port, data, onSave }: {
    name: string;
    port: number;
    data: SelectItem[];
    onSave: (port: number) => void;
  },
) => {
  const portStr = port.toString();
  const authToken = useRecoilValue(tokenSelector);
  const [value, setValue] = useState<string | null>(portStr);
  const editedData = data
    .map((v) => ({ ...v, disabled: v.value === portStr ? false : v.disabled }));
  const isChanged = useMemo(() => portStr !== value, [portStr, value]);
  return (
    <Group position="apart">
      <Select
        w={90}
        label={name}
        data={editedData}
        value={value}
        onChange={setValue}
      />
      <Button
        mt={25}
        disabled={!isChanged}
        onClick={() => {
          const port = Number(value);
          setPort(authToken, name, port).then(() => {
            onSave(port);
            showNotification({
              title: "Change Port Success",
              message: `${portStr} to ${value}`,
              color: "green",
              icon: <Check />,
            });
          }).catch((err: Error) => {
            showNotification({
              title: "Change Port Failed",
              message: err.toString(),
              color: "red",
              icon: <X />,
            });
          });
        }}
      >
        Change
      </Button>
    </Group>
  );
};

const Routing = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [routeNames, setRouteNames] = useState<string[]>([]);
  const [routerStatus, setRouterStatus] = useState<string>("Unknown");
  const [isRouterEnable, routerEnableHandler] = useDisclosure(false);
  const [appPorts, setAppPorts] = useState<{ [name: string]: number }>({});
  const [portChoices, setPortChoices] = useState<SelectItem[]>([]);

  useEffect(() => {
    if (routeNames.length === 0) getRouteList(authToken).then(setRouteNames);
    getPorts(authToken).then(({ start, ports }) => {
      const selectedPorts = Object.values(ports);
      const portChoices: SelectItem[] = [];
      for (let i = start; i < start + 100; i++) {
        portChoices.push({
          value: i.toString(),
          label: i.toString(),
          disabled: selectedPorts.includes(i),
        });
      }
      setPortChoices(portChoices);
      setAppPorts(ports);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, setRouteNames, setAppPorts]);

  useEffect(() => {
    getRoutingStatus(authToken).then((ret) => {
      if (ret !== "Disable") routerEnableHandler.open();
      setRouterStatus(ret);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, routerStatus]);

  const openNewModal = () => {
    const modalId = "newroute";
    openModal({
      modalId,
      title: "New Route",
      centered: true,
      children: (
        <NewRouteForm
          onSave={(name) => {
            setRouteNames((values) => {
              values.push(name);
              return values;
            });
            closeModal(modalId);
          }}
          onCancel={() => closeModal(modalId)}
        />
      ),
    });
  };

  return (
    <Stack>
      <Title order={4}>App Port</Title>
      <Stack>
        <Group>
          {Object.keys(appPorts).map((name) => (
            <Paper p={10} withBorder>
              <AppPort
                name={name}
                port={appPorts[name]}
                data={portChoices}
                onSave={(port) => {
                  const prevPort = String(appPorts[name]);
                  setAppPorts((value) => {
                    value[name] = port;
                    return value;
                  });
                  setPortChoices((value) =>
                    value.map(({ disabled, ...v }) => {
                      if (v.value === String(port)) {
                        disabled = true;
                      } else if (v.value === prevPort) {
                        disabled = false;
                      }
                      return ({ ...v, disabled });
                    })
                  );
                }}
              />
            </Paper>
          ))}
        </Group>
      </Stack>
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
        <Button onClick={() => openNewModal()}>New</Button>
      </Group>
      <Accordion variant="separated" w={300}>
        {routeNames.map((route) => (
          <RouteDetail
            route={route}
            onDelete={() =>
              setRouteNames((value) => value.filter((v) => v !== route))}
          />
        ))}
      </Accordion>
    </Stack>
  );
};

export default Routing;
