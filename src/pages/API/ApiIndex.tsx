import { ReactNode, useEffect, useState } from "react";
import {
  ActionIcon,
  Affix,
  Box,
  Button,
  Center,
  Group,
  NavLink,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { closeModal, openModal } from "@mantine/modals";
import { Check, Plus, Refresh } from "tabler-icons-react";
import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { tokenSelector } from "../../recoil/user";
import { getAPIs } from "../../EbinaAPI/app/api";
import { getScriptList } from "../../EbinaAPI/app/script";
import ApiDetailForm from "./ApiDetailForm";

interface APIs {
  apis: { path: string; name: string }[];
  child: { [path: string]: APIs };
}

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
