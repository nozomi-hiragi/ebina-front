import { Suspense, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Breadcrumbs,
  Center,
  Group,
  Loader,
  Navbar,
  Stack,
  Text,
} from "@mantine/core";
import BaseMenu from "./BaseMenu";
import EbinaHeader from "./EbinaHeader";
import { getLabelFromPaht } from "../App";
import UnauthorizedErrorBoundary from "./UnauthorizedErrorBoundary";
import CheckLoggedIn from "./CheckLoggedIn";

const DashboardBase = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

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
        <UnauthorizedErrorBoundary>
          <CheckLoggedIn>
            <Suspense
              fallback={
                <Center>
                  <Loader variant="bars" />
                </Center>
              }
            >
              <Outlet />
            </Suspense>
          </CheckLoggedIn>
        </UnauthorizedErrorBoundary>
      </Stack>
    </AppShell>
  );
};

export default DashboardBase;
