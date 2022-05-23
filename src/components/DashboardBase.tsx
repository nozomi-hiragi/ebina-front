import { ReactNode, useState } from "react";
import { Box } from "@mui/system";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { CssBaseline, Drawer, Toolbar } from "@mui/material";

const DashboardBase = ({ children }: { children: ReactNode }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false)
  const drawerWidth = 240;
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header onMenuButtonClick={() => { setDrawerOpen(!isDrawerOpen) }} />
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={isDrawerOpen}
          onClose={() => { setDrawerOpen(false) }}
          ModalProps={{ keepMounted: true, }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}>
          <Sidebar />
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}>
          <Sidebar />
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}

export default DashboardBase
