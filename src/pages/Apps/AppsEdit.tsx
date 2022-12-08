import {
  Affix,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { DeviceFloppy, Trash } from "tabler-icons-react";
import { appNameListSelector } from "../../recoil/atoms";
import { createApp, deleteApp } from "../../EbinaAPI/app/app";
import { tokenSelector } from "../../recoil/user";

const AppsEdit = () => {
  const authToken = useRecoilValue(tokenSelector);
  const navigate = useNavigate();
  const setAppNameList = useSetRecoilState(appNameListSelector);
  const [appName, setAppName] = useState(useParams().appName ?? "new");
  const [isNew] = useState(appName === "new");
  const [isOpenDialog, setIsOpenDialog] = useState<boolean>(false);

  const appMenuItems = [
    { label: "API", path: `api` },
    { label: "Edit", path: `edit` },
    { label: "Constant Run", path: `constantrun` },
  ];

  return (
    <Stack>
      <Group p={8}>
        {isNew
          ? (
            <TextInput
              id="appName"
              label="App Name"
              onChange={(e) => setAppName(e.target.value)}
            />
          )
          : <Title order={2}>{isNew ? "New App" : appName}</Title>}
      </Group>
      {!isNew && (
        <Stack>
          {appMenuItems.map((item) => (
            <Button
              key={item.label}
              sx={{ width: 200 }}
              component={Link}
              to={item.path}
            >
              {item.label}
            </Button>
          ))}
          <Group p={8} onClick={() => setIsOpenDialog(true)}>
            <Trash />
            <Text>Delete</Text>
          </Group>
        </Stack>
      )}
      {isNew && (
        <Affix position={{ bottom: 20, right: 20 }}>
          <Button
            sx={{ width: 50, height: 50 }}
            p={0}
            radius="xl"
            onClick={() => {
              if (isNew) {
                createApp(authToken, appName).then(() => {
                  setAppNameList([]);
                  navigate(-1);
                });
              }
            }}
          >
            <DeviceFloppy />
          </Button>
        </Affix>
      )}
      <Modal
        opened={isOpenDialog}
        onClose={() => setIsOpenDialog(false)}
        title={`Delete APP`}
      >
        <Text color="red">{`Delete "${appName}"?`}</Text>
        <Group position="right">
          <Button onClick={() => setIsOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              deleteApp(authToken, appName).then(() => {
                setAppNameList([]);
                navigate(-1);
              }).catch((err) => console.log(err));
            }}
          >
            Delete
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
};

export default AppsEdit;
