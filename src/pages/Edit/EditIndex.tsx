import { Refresh, Add } from "@mui/icons-material"
import { Box, Toolbar, Typography, Tooltip, IconButton, List, ListItemText, ListItemButton, Fab, Divider } from "@mui/material"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useRecoilValue } from "recoil"
import { appNameSelector } from "../../atoms"
import EbinaAPI from "../../EbinaAPI"

var cacheAppName = ''

const EditIndex = () => {
  const [fileList, setFileList] = useState<string[]>([])
  const [refreshState, setRefreshState] = useState(true)
  const appName = useRecoilValue(appNameSelector)

  useEffect(() => {
    if (refreshState || cacheAppName !== appName) {
      EbinaAPI.getJSList(appName).then((list) => { setFileList(list.data) })
      setRefreshState(false)
      cacheAppName = appName
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshState, appName])

  return (
    <Box>
      <Toolbar
        sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, }}>
        <Typography id="tableTitle" sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          {`Edit`}
        </Typography>
        <Tooltip title="Refresh State">
          <IconButton onClick={() => setRefreshState(true)}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Divider />
      <List>
        {fileList.map((item) => (
          <ListItemButton key={item} component={Link} to={`${item}`}>
            <ListItemText primary={item} />
          </ListItemButton>)
        )}
      </List>
      <Fab color="primary" aria-label="add" sx={{ position: 'absolute', bottom: 16, right: 16, }} component={Link} to="new">
        <Add />
      </Fab>
    </Box >
  )
}

export default EditIndex
