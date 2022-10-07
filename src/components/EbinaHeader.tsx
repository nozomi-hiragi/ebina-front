import React from "react";
import { useSetRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import {
  ActionIcon,
  Burger,
  Button,
  Group,
  Header,
  MantineSize,
  MediaQuery,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { Moon, Sun } from "tabler-icons-react";
import { userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";
import { useMediaQuery } from "@mantine/hooks";

type HeaderProps = {
  hideSize?: MantineSize;
  isOpen?: boolean;
  onBurgerClick?: (e: any) => void;
};

const EbinaHeader: React.FC<HeaderProps> = (props) => {
  const navigate = useNavigate();
  const setUser = useSetRecoilState(userSelector);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isMid = useMediaQuery("(min-width: 768px)");
  const isSml = useMediaQuery("(min-width: 360px)");
  const isDark = colorScheme === "dark";

  return (
    <Header height={70} p="md">
      <Group position="apart">
        <Group>
          <MediaQuery
            largerThan={props.hideSize ?? 0}
            styles={{ display: "none" }}
          >
            <Burger
              opened={props.isOpen ?? false}
              onClick={props.onBurgerClick}
              size="sm"
            />
          </MediaQuery>
          <Title order={isMid ? 2 : (isSml ? 3 : 4)}>EbinaStation</Title>
        </Group>
        <Group>
          <ActionIcon
            variant="outline"
            color={isDark ? "yellow" : "violet"}
            onClick={() => {
              toggleColorScheme();
            }}
          >
            {isDark ? <Sun /> : <Moon />}
          </ActionIcon>
          <Button
            color="inherit"
            onClick={() => {
              EbinaAPI.logout();
              setUser(null);
              navigate("/");
            }}
          >
            Logout
          </Button>
        </Group>
      </Group>
    </Header>
  );
};

export default EbinaHeader;
