import { MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { Stack, Tooltip, UnstyledButton } from "@mantine/core";
import { Apps, Database, Home, Settings, User } from "tabler-icons-react";

type BaseMenuProps = {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const BaseMenu: React.FC<BaseMenuProps> = (props: BaseMenuProps) => {
  const baseMenuItems = [
    { label: "Home", path: "", icon: <Home /> },
    { label: "Users", path: "users", icon: <User /> },
    { label: "Apps", path: "apps", icon: <Apps /> },
    { label: "Database", path: "database", icon: <Database /> },
    { label: "Settings", path: "setting", icon: <Settings /> },
  ];

  return (
    <Stack
      align="center"
      justify="flex-start"
      spacing="xs"
      sx={{ height: "100%" }}
    >
      {baseMenuItems.map((item) => (
        <Tooltip key={item.label} label={item.label} position="right">
          <UnstyledButton<typeof Link>
            sx={{
              width: 50,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
              display: "flex",
            }}
            component={Link}
            to={item.path}
            onClick={props.onClick}
          >
            {item.icon}
          </UnstyledButton>
        </Tooltip>
      ))}
    </Stack>
  );
};

export default BaseMenu;
