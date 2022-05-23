import { Box } from "@mui/system";
import { List, ListItemButton, ListItemText, Toolbar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate()
  const items = [
    { name: 'Home', path: '/', },
    { name: 'Users', path: '/users', },
  ]
  return (
    <Box>
      <Toolbar />
      <List>
        {items.map(item => {
          return (
            <ListItemButton key={item.name} onClick={() => { navigate(item.path) }}>
              <ListItemText>
                {item.name}
              </ListItemText>
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
}

export default Sidebar
