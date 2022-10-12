import { Suspense, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Breadcrumbs,
  Group,
  Navbar,
  Stack,
  Text,
} from "@mantine/core";
import BaseMenu from "./BaseMenu";
import EbinaHeader from "./EbinaHeader";
import EbinaAPI from "../EbinaAPI";
import { useSetRecoilState } from "recoil";
import { userSelector } from "../atoms";
import { getLabelFromPaht } from "../App";

const DashboardBase = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const setUser = useSetRecoilState(userSelector);
  const navigate = useNavigate();

  EbinaAPI.checkExired().catch(() => {
    setUser(null);
    navigate("/");
  });

  const location = useLocation();
  const paths = location.pathname.split("/").filter((value) => value !== "");

  const temp = ["/"];
  const anchors = paths.map((path) => {
    temp.push(path);
    const label = getLabelFromPaht(path);
    const to = temp.join("/");
    return path === paths[paths.length - 1]
      ? <Text key={to}>{label}</Text>
      : <Anchor key={to} component={Link} to={to}>{label}</Anchor>;
  });

  return (
    <AppShell
      fixed
      header={
        <EbinaHeader
          hideSize="sm"
          isOpen={isDrawerOpen}
          onBurgerClick={() => setDrawerOpen((o) => !o)}
        />
      }
      navbar={
        <Navbar
          width={{ base: 200 }}
          p={0}
          hidden={!isDrawerOpen}
          hiddenBreakpoint="sm"
        >
          <Group sx={{ height: "100%" }} spacing="xs" pl="lg">
            <BaseMenu
              onClick={() => {
                setDrawerOpen(false);
              }}
            />
          </Group>
        </Navbar>
      }
      navbarOffsetBreakpoint="sm"
      padding={0}
    >
      <Stack px="sm" sx={{ height: "100%" }}>
        <Breadcrumbs mt="sm">
          {anchors}
        </Breadcrumbs>
        <Suspense>
          <Outlet />
        </Suspense>
      </Stack>
    </AppShell>
  );
};

export default DashboardBase;
