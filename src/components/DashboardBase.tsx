import React, { Suspense, useCallback } from "react";
import { useState } from "react";
import { Box } from "@mui/system";
import SideMenu from "./SideMenu";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

function useClientRect(): [DOMRect | null, (node: HTMLDivElement) => void] {
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const ref = useCallback((node: HTMLElement | undefined) => { node && setRect(node.getBoundingClientRect()) }, []);
  return [rect, ref];
}

const DashboardBase = () => {
  const [rect, ref] = useClientRect()
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  return (<>
    <Box>
      <Header menuButton hideMenuAtWide onMenuButtonClick={() => { setDrawerOpen(!isDrawerOpen) }} />
      <SideMenu open={isDrawerOpen} onClose={() => { setDrawerOpen(false) }} >
        <Box component="main" ref={ref} width='100%' height={`calc(100vh - ${rect?.y}px)`}>
          <Suspense>
            <Outlet />
          </Suspense>
        </Box>
      </SideMenu>
    </Box>
  </>)
}

export default DashboardBase
