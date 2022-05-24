import { Box } from "@mui/system";
import { Drawer, List, ListItemButton, ListItemText, ModalProps, Toolbar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

type SideMenuProps = {
  open?: boolean,
  onClose?: ModalProps['onClose'],
  children?: ReactNode,
}

const SideMenu: React.FC<SideMenuProps> = (props: SideMenuProps) => {
  const drawerWidth = 240
  const navigate = useNavigate()
  const items = [
    { name: 'Home', path: '', },
    { name: 'Users', path: 'users', },
    { name: 'API', path: 'api', },
  ]
  const ItemElements = (
    <Box width={drawerWidth}>
      <Toolbar />
      <List>
        {items.map(item => (
          <ListItemButton key={item.name} onClick={() => { navigate(item.path) }}>
            <ListItemText>{item.name}</ListItemText>
          </ListItemButton>
        ))}
      </List>
    </Box>
  )
  const DrawerElement = (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer variant="temporary" open={props.open} onClose={props.onClose} ModalProps={{ keepMounted: true, }} sx={{ display: { xs: 'block', sm: 'none' } }}>
        {ItemElements}
      </Drawer>
      <Drawer variant="permanent" open sx={{ display: { xs: 'none', sm: 'block' } }}>
        {ItemElements}
      </Drawer>
    </Box>
  )
  return props.children ? (<Box display={'flex'}>{DrawerElement}{props.children}</Box>) : DrawerElement
}

export default SideMenu
