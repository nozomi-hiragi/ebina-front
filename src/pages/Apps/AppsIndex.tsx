import { Suspense } from "react";
import {
  ActionIcon,
  Affix,
  Button,
  Container,
  Navbar,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Plus, Refresh } from "tabler-icons-react";
import { appNameListSelector } from "../../atoms";

const AppList = () => {
  const navigate = useNavigate();
  const appNameList = useRecoilValue(appNameListSelector);
  return (
    <Stack>
      {appNameList.map((appName) => (
        <UnstyledButton
          key={appName}
          onClick={() => {
            navigate(appName);
          }}
          p={4}
          m={4}
        >
          <Navbar.Section>
            <Text>{appName}</Text>
          </Navbar.Section>
        </UnstyledButton>
      ))}
    </Stack>
  );
};

const AppsIndex = () => {
  const setAppNameList = useSetRecoilState(appNameListSelector);
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
        <Text size="xl" weight={50}>Apps</Text>
        <ActionIcon
          size="xl"
          radius="xl"
          onClick={() => {
            setAppNameList([]);
          }}
        >
          <Refresh />
        </ActionIcon>
      </Container>
      <Suspense>
        <AppList />
      </Suspense>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Button
          sx={{ width: 50, height: 50 }}
          p={0}
          radius="xl"
          component={Link}
          to="new"
        >
          <Plus />
        </Button>
      </Affix>
    </Container>
  );
};

export default AppsIndex;
