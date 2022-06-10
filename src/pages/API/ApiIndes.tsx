import { useEffect, useState } from "react"
import { Box, Button, Divider, Fab, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Toolbar, Tooltip, Typography } from "@mui/material"
import { Add, Refresh } from "@mui/icons-material"
import { Link } from "react-router-dom"
import EbinaAPI from "../../EbinaAPI"
import { useRecoilValue } from "recoil"
import { appNameSelector } from "../../atoms"

var cacheAppName = ''

const ApiIndex = () => {
  const [apiState, setApiState] = useState<any>({})
  const [apis, setApisState] = useState<any[]>([])
  const [refreshState, setRefreshState] = useState(true)
  const appName = useRecoilValue(appNameSelector)

  useEffect(() => {
    if (refreshState || cacheAppName !== appName) {
      EbinaAPI.getAPIStatus(appName).then((res) => { if (res.status === 200) setApiState(res.data) })
      EbinaAPI.getAPIs(appName).then((res) => { if (res.status === 200) setApisState(res.data) })
      setRefreshState(false)
      cacheAppName = appName
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshState, appName])

  let labelStartButton: string = ''
  let labelStatus: string = ''
  switch (apiState.status) {
    case 'started':
      labelStatus = 'Runging'
      labelStartButton = 'Restart'
      break;
    case 'stop':
      labelStatus = 'Stop'
      labelStartButton = 'Start'
      break;
    default:
      break;
  }
  return (
    <Box>
      <Toolbar
        sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, }}>
        <Typography id="tableTitle" sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          {`API`}
        </Typography>
        <Tooltip title="Refresh State">
          <IconButton onClick={() => setRefreshState(true)}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider />
      <List>
        <ListSubheader component="div" id="nested-list-subheader">
          Status
        </ListSubheader>
        <ListItem>
          <ListItemText
            primary={`${labelStatus}`}
            secondary={` ${apiState.started_at ? 'at ' + (new Date(apiState.started_at)).toLocaleString() : ''}`} />
          <ListItemIcon>
            <Button variant="contained" onClick={() => EbinaAPI.startAPI(appName).then(() => setRefreshState(true))}>
              {labelStartButton}
            </Button>
          </ListItemIcon>
          <Box width='8pt' />
          <ListItemIcon>
            <Button variant="contained" onClick={() => EbinaAPI.stopAPI(appName).then(() => setRefreshState(true))}>
              Stop
            </Button>
          </ListItemIcon>
        </ListItem>
        <Divider />
        <ListSubheader component="div" id="nested-list-subheader">
          API List
        </ListSubheader>
        {apis.map((item) => (
          <ListItemButton key={item.name} component={Link} to={`edit?name=${item.name}`}>
            <ListItemText primary={item.name} secondary={item.path} />
          </ListItemButton>)
        )}
      </List>
      <Fab color="primary" aria-label="add" sx={{ position: 'absolute', bottom: 16, right: 16, }} component={Link} to="edit">
        <Add />
      </Fab>
    </Box >
  )
}

export default ApiIndex
