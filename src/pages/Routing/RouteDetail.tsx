import {
  Accordion,
  ActionIcon,
  Box,
  Button,
  Group,
  NumberInput,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import { useEffect, useMemo, useState } from "react";
import { useRecoilValue } from "recoil";
import { Check, Trash, X } from "tabler-icons-react";
import {
  deleteRoute,
  getRoute,
  NginxConf,
  setRoute,
} from "../../EbinaAPI/routing";
import { tokenSelector } from "../../recoil/user";

const RouteDetail = (
  { route, onDelete }: { route: string; onDelete: () => void },
) => {
  const authToken = useRecoilValue(tokenSelector);
  const initialValues: NginxConf = { hostname: "", port: 0 };
  const [valuesCache, setValuesCache] = useState<NginxConf>(initialValues);
  const routeForm = useForm<NginxConf>({ initialValues });
  const isNumber = useMemo(
    () => Number.isInteger(routeForm.values.port),
    [routeForm.values.port],
  );

  useEffect(() => {
    getRoute(authToken, route).then((conf) => {
      routeForm.setValues(conf);
      setValuesCache(conf);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, authToken, setValuesCache]);

  const openDeleteModal = (name: string) =>
    openConfirmModal({
      title: "Delete Route",
      centered: true,
      children: <Text color="red">Delete "{name}"?</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        deleteRoute(authToken, name).then(() => {
          onDelete && onDelete();
        }).catch((err) =>
          showNotification({
            title: "Delete Route Failed",
            message: err.toString(),
            color: "red",
            icon: <X />,
          })
        ),
    });

  return (
    <Accordion.Item key={route} value={route}>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Accordion.Control>
          {route}
        </Accordion.Control>
        <ActionIcon size="lg" onClick={() => openDeleteModal(route)}>
          <Trash size={20} />
        </ActionIcon>
      </Box>
      <Accordion.Panel>
        <form
          onSubmit={routeForm.onSubmit((values) => {
            setRoute(authToken, route, values).then((ret) => {
              showNotification(
                ret
                  ? {
                    title: "Save Route Success",
                    message: "Updated",
                    color: "green",
                    icon: <Check />,
                  }
                  : {
                    title: "Save Route Failed",
                    message: "failed",
                    color: "red",
                    icon: <X />,
                  },
              );
            });
          })}
        >
          <TextInput
            label="Hostname"
            placeholder="example.com"
            {...routeForm.getInputProps("hostname")}
          />
          {isNumber
            ? (
              <NumberInput
                label="Port"
                placeholder="3456"
                {...routeForm.getInputProps("port")}
              />
            )
            : <TextInput label="Port" value={routeForm.values.port} disabled />}
          <Group position="right" mt="md">
            <Button onClick={() => routeForm.setValues(valuesCache)}>
              Reset
            </Button>
            <Button type="submit">Save</Button>
          </Group>
        </form>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export default RouteDetail;
