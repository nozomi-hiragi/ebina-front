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
import { Plus, Refresh, X } from "tabler-icons-react";
import { appNameListSelector } from "../../recoil/atoms";
import { closeModal, openModal } from "@mantine/modals";
import { createApp } from "../../EbinaAPI/app/app";
import { tokenSelector } from "../../recoil/user";
import { showNotification } from "@mantine/notifications";

const CreateAppForm = (
  { onCreate, onCancel }: { onCreate: () => void; onCancel: () => void },
) => {
  const authToken = useRecoilValue(tokenSelector);
  const [appName, setAppName] = useState("");
  return (
    <Stack>
      <TextInput
        id="appName"
        label="App Name"
        onChange={(e) => setAppName(e.target.value)}
      />
      <Group position="right">
        <Button variant="default" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() =>
            createApp(authToken, appName).then(onCreate).catch((err: Error) =>
              showNotification({
                title: "Create App Error",
                message: err.toString(),
                color: "red",
                icon: <X />,
              })
            )}
        >
          Create
        </Button>
      </Group>
    </Stack>
  );
};

const AppList = () => {
  const navigate = useNavigate();
  const [appNameList, setAppNameList] = useRecoilState(appNameListSelector);
  const openCreateModal = () => {
    const modalId = "createapp";
    openModal({
      modalId,
      title: "Create App",
      centered: true,
      children: (
        <CreateAppForm
          onCreate={() => {
            setAppNameList([]);
            closeModal(modalId);
          }}
          onCancel={() => closeModal(modalId)}
        />
      ),
    });
  };

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
