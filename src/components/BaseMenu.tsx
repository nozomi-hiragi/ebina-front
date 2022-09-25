import { MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { Group, Stack, Tooltip, UnstyledButton } from "@mantine/core";
import {
  Apps,
  ArrowRampRight,
  Database,
  Home,
  Settings,
  User,
} from "tabler-icons-react";

type BaseMenuProps = {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const BaseMenu: React.FC<BaseMenuProps> = (props: BaseMenuProps) => {
  const baseMenuItems = [
    { label: "Home", path: "", icon: <Home /> },
    { label: "Members", path: "members", icon: <User /> },
    { label: "Apps", path: "apps", icon: <Apps /> },
    { label: "Database", path: "database", icon: <Database /> },
    { label: "Routing", path: "routing", icon: <ArrowRampRight /> },
    { label: "Settings", path: "settings", icon: <Settings /> },
  ];

  return (
    <Stack
      align="flex-start"
      justify="flex-start"
      spacing="xs"
      sx={{ height: "100%" }}
    >
      {baseMenuItems.map((item) => (
        <Tooltip key={item.label} label={item.label} position="right">
          <UnstyledButton<typeof Link>
            sx={{
              height: 50,
              alignItems: "center",
              justifyContent: "start",
              display: "flex",
            }}
            component={Link}
            to={item.path}
            onClick={props.onClick}
          >
            <Group position="center" sx={{ width: 50, height: 50 }}>
              {item.icon}
            </Group>
            <span>{item.label}</span>
          </UnstyledButton>
        </Tooltip>
      ))}
    </Stack>
  );
};

export default BaseMenu;
