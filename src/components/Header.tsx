import React from "react";
import { useSetRecoilState } from 'recoil'
import { AppBar, Button, IconButton, Toolbar, Typography } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from "react-router-dom";
import { userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";

type HeaderProps = {
  menuButton?: boolean,
  hideMenuAtWide?: boolean,
  onMenuButtonClick?: (e: any) => void
}

const Header: React.FC<HeaderProps> = (props) => {
  const navigate = useNavigate()
  const setUser = useSetRecoilState(userSelector)
  return (<>
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {props.menuButton && <IconButton
          size="large"
          edge="start"
          color="inherit"
          sx={{ mr: 2, display: props.hideMenuAtWide ? { sm: 'none' } : undefined }}
          onClick={props.onMenuButtonClick}>
          <MenuIcon />
        </IconButton>}
        <Typography variant='h6' component='div' sx={{ flexGrow: 1 }}>
          EbinaStation
        </Typography>
        <Button color="inherit" onClick={() => {
          EbinaAPI.logout()
          setUser(null)
          navigate('/')
        }}>Logout</Button>
      </Toolbar>
    </AppBar>
  </>)
}

export default Header
