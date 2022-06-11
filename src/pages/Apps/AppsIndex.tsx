import { Add, Refresh } from "@mui/icons-material"
import { Box, Divider, Fab, IconButton, List, ListItemButton, ListItemText, Toolbar, Tooltip, Typography } from "@mui/material"
import { Suspense } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { appNameListSelector } from "../../atoms"

const AppList = () => {
  const navigate = useNavigate()
  const appNameList = useRecoilValue(appNameListSelector)
  return (<List>
    {appNameList.map((appName) => (
      <ListItemButton key={appName} onClick={() => { navigate(appName) }}>
        <ListItemText>{appName}</ListItemText>
      </ListItemButton>
    ))}
  </List >)
}

const AppsIndex = () => {
  const setAppNameList = useSetRecoilState(appNameListSelector)
  return (
    <Box>
      <Toolbar
        sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, }}>
        <Typography id="tableTitle" sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          {`Apps`}
        </Typography>
        <Tooltip title="Refresh State">
          <IconButton onClick={() => { setAppNameList([]) }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider />
      <Suspense>
        <AppList />
      </Suspense>
      <Fab color="primary" aria-label="add" sx={{ position: 'absolute', bottom: 16, right: 16, }} component={Link} to="new">
        <Add />
      </Fab>
    </Box>
  )
}

export default AppsIndex
