import { useEffect, useState } from "react"
import axios from "axios"
import { Box, Button, Divider, Fab, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Toolbar, Tooltip, Typography } from "@mui/material"
import { Add, Refresh } from "@mui/icons-material"

const API = () => {
  const [apiState, setApiState] = useState<any>({})
  const [apis, setApisState] = useState<any[]>([])
  const [refreshState, setRefreshState] = useState(true)
  const url = localStorage.getItem('server')

  useEffect(() => {
    if (refreshState) {
      axios.get(url + 'ebina/api/status').then((res) => { if (res.status === 200) setApiState(res.data) })
      axios.get(url + 'ebina/api/apis').then((res) => { if (res.status === 200) setApisState(res.data) })
      setRefreshState(false)
    }
  }, [refreshState, url])

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
          {`API  `}
        </Typography>
        <Tooltip title="Create User">
          <IconButton onClick={() => setRefreshState(true)}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <List>
        <Divider />
        <ListSubheader component="div" id="nested-list-subheader">
          Status
        </ListSubheader>
        <ListItem>
          <ListItemText
            primary={`${labelStatus}`}
            secondary={` ${apiState.started_at ? 'at ' + (new Date(apiState.started_at)).toLocaleString() : ''}`} />
          <ListItemIcon>
            <Button variant="contained" onClick={() => axios.post(url + 'ebina/api/start').then((res) => setRefreshState(true))}>
              {labelStartButton}
            </Button>
          </ListItemIcon>
          <Box width='8pt' />
          <ListItemIcon>
            <Button variant="contained" onClick={() => axios.post(url + 'ebina/api/stop').then((res) => setRefreshState(true))}>
              Stop
            </Button>
          </ListItemIcon>
        </ListItem>
        <Divider />
        <ListSubheader component="div" id="nested-list-subheader">
          API List
        </ListSubheader>
        {apis.map((item) =>
          (<ListItemButton key={item.path}><ListItemText primary={item.name} secondary={item.path} /></ListItemButton>)
        )}
      </List>
      <Fab color="primary" aria-label="add" sx={{ position: 'absolute', bottom: 16, right: 16, }}>
        <Add />
      </Fab>
    </Box >
  )
}

export default API
