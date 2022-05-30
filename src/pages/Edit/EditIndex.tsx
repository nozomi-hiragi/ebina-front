import { Refresh, Add } from "@mui/icons-material"
import { Box, Toolbar, Typography, Tooltip, IconButton, List, ListItemText, ListItemButton, Fab, Divider } from "@mui/material"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import EbinaAPI from "../../EbinaAPI"

const EditIndex = () => {
  const [fileList, setFileList] = useState<string[]>([])
  const [refreshState, setRefreshState] = useState(true)

  useEffect(() => {
    if (refreshState) {
      EbinaAPI.getJSList().then((list) => { setFileList(list.data) })
      setRefreshState(false)
    }
  }, [refreshState])
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
