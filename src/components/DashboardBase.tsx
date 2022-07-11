import { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppShell, Navbar, Group } from "@mantine/core";
import BaseMenu from "./BaseMenu";
import AppMenu from "./AppMenu";
import EbinaHeader from "./EbinaHeader"

const DashboardBase = () => {
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  return (<>
    <AppShell
      fixed
      header={<EbinaHeader hideSize="sm" isOpen={isDrawerOpen} onBurgerClick={() => setDrawerOpen((o) => !o)} />}
      navbar={
        <Navbar width={{ base: 270 }} p={0} hidden={!isDrawerOpen} hiddenBreakpoint="sm">
          <Group sx={{ height: "100%" }} spacing="xs">
            <BaseMenu onClick={() => { setDrawerOpen(false) }} />
            <AppMenu onClick={() => { setDrawerOpen(false) }} />
          </Group>
        </Navbar>
      }
      navbarOffsetBreakpoint="sm"
    >
      <Suspense>
        <Outlet />
      </Suspense>
    </AppShell >
  </>)
}

export default DashboardBase
