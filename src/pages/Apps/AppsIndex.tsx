import { Suspense, useState } from "react";
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { Plus, Refresh } from "tabler-icons-react";
import { appNameListSelector } from "../../recoil/atoms";
import { openConfirmModal } from "@mantine/modals";
import { createApp } from "../../EbinaAPI/app/app";
import { tokenSelector } from "../../recoil/user";

const AppList = () => {
  const navigate = useNavigate();
  const [appNameList, setAppNameList] = useRecoilState(appNameListSelector);
  const authToken = useRecoilValue(tokenSelector);
  const [appName, setAppName] = useState("");
  const openCreateModal = () =>
    openConfirmModal({
      title: "Create App",
      centered: true,
      children: (
        <TextInput
          id="appName"
          label="App Name"
          onChange={(e) => setAppName(e.target.value)}
        />
      ),
      labels: { confirm: "Create", cancel: "Cancel" },
      onConfirm: () =>
        createApp(authToken, appName).then(() => setAppNameList([])),
    });

  return (
    <SimpleGrid
      breakpoints={[
        { minWidth: "xs", cols: 1 },
        { minWidth: "sm", cols: 2 },
        { minWidth: "lg", cols: 3 },
        { minWidth: "xl", cols: 4 },
      ]}
    >
      {appNameList.map((appName) => (
        <Center key={appName}>
          <Paper
            w={300}
            px={8}
            py={4}
            withBorder
            onClick={() => navigate(appName)}
          >
            <Title order={2}>{appName}</Title>
          </Paper>
        </Center>
      ))}
      <Center>
        <Button w={300} onClick={openCreateModal}>
          <Plus /> <Text fz="lg">New</Text>
        </Button>
      </Center>
    </SimpleGrid>
  );
};

const AppsIndex = () => {
  const setAppNameList = useSetRecoilState(appNameListSelector);
  return (
    <Stack>
      <Group position="apart">
        <Title>Apps</Title>
        <ActionIcon size="xl" radius="xl" onClick={() => setAppNameList([])}>
          <Refresh />
        </ActionIcon>
      </Group>
      <Suspense>
        <AppList />
      </Suspense>
    </Stack>
  );
};

export default AppsIndex;
