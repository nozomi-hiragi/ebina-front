import { MouseEventHandler } from "react";
import { Link } from "react-router-dom";
import { Group, Stack, Tooltip, UnstyledButton } from "@mantine/core";
import { menuItems } from "../App";

type BaseMenuProps = {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const BaseMenu: React.FC<BaseMenuProps> = (props: BaseMenuProps) => {
  return (
    <Stack
      align="flex-start"
      justify="flex-start"
      spacing="xs"
      sx={{ height: "100%" }}
    >
      {menuItems.map((item) => (
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
