import React, { Suspense } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { AppBar, Button, FormControl, IconButton, MenuItem, Select, Toolbar, Typography } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from "react-router-dom";
import { appNameListSelector, appNameSelector, userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";

type HeaderProps = {
  menuButton?: boolean,
  hideMenuAtWide?: boolean,
  onMenuButtonClick?: (e: any) => void
}

const AppNameSelector = () => {
  const appNameList = useRecoilValue(appNameListSelector)
  const [appName, setAppName] = useRecoilState(appNameSelector)
  return <FormControl variant="standard" sx={{ m: 1, minWidth: 200 }}>
    <Select
      value={appName}
      sx={{ color: "inherit" }}
      onChange={(e) => { setAppName(e.target.value) }}
    >
      {appNameList.map((appName) => <MenuItem key={appName} value={appName}>{appName}</MenuItem>)}
    </Select>
  </FormControl>
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
        <Suspense>
          <AppNameSelector />
        </Suspense>
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
