import { Delete, Save } from "@mui/icons-material"
import { Box, Fab, List, ListItemButton, ListItemIcon, ListItemText, TextField, Typography } from "@mui/material"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useSetRecoilState } from "recoil"
import { appNameListSelector } from "../../atoms"
import DeleteConfirmDialog from "../../components/DeleteConfirmDialog"
import EbinaAPI from "../../EbinaAPI"

const AppsEdit = () => {
  const navigate = useNavigate()
  const setAppNameList = useSetRecoilState(appNameListSelector)
  const [appName, setAppName] = useState(useParams().name ?? 'new')
  const [isNew] = useState(appName === 'new')
  const [isOpenDialog, setIsOpenDialog] = useState<boolean>(false)
  return (<>
    <Box p={2}>
      {isNew
        ? <TextField id="appName" label="App Name" variant="standard" onChange={(e) => setAppName(e.target.value)} />
        : <Typography variant="h5">{isNew ? 'New App' : appName}</Typography>
      }
    </Box>
    <List>
      {!isNew && <ListItemButton onClick={() => { setIsOpenDialog(true) }}>
        <ListItemIcon>
          <Delete />
        </ListItemIcon>
        <ListItemText>
          Delete
        </ListItemText>
      </ListItemButton>}
    </List>
    {isNew && <Fab color="primary" aria-label="add" sx={{ position: 'absolute', bottom: 16, right: 16, }} onClick={() => {
      if (isNew) {
        EbinaAPI.createApp(appName).then((res) => {
          setAppNameList([])
          navigate('..')
        })
      }
    }}>
      <Save />
    </Fab>}
    <DeleteConfirmDialog
      title={`Delete App`}
      content={appName}
      open={isOpenDialog}
      onClose={() => { setIsOpenDialog(false) }}
      onDelete={() => {
        EbinaAPI.deleteApp(appName).then(() => {
          setAppNameList([])
          navigate('..')
        }).catch((err) => { console.log(err) })
      }}
    />
  </>)
}

export default AppsEdit
