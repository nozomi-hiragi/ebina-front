import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { Box, Button, List, ListItem, TextField } from "@mui/material"
import DeleteApiPathDialog from "../components/DeleteApiPathDialog";
import EbinaAPI from "../EbinaAPI";

function useQuery() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

type TypeApi = {
  path: string,
  name: string,
  type: string,
  value: string,
}

const APIEdit = () => {
  const [api, setApiState] = useState<TypeApi>({ path: "", name: "", type: "", value: "" })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const navigate = useNavigate()

  const query = useQuery()
  const path = query.get('path')

  useEffect(() => {
    if (path) {
      EbinaAPI.getPath(path).then((res) => {
        if (res.status === 200) setApiState(res.data)
      })
    }
  }, [path])

  return (
    <Box m={1}>
      <List>
        <ListItem>
          <TextField label="path" variant="standard" fullWidth value={api.path} onChange={(e) => {
            setApiState({ path: e.target.value, name: api.name, type: api.type, value: api.value })
          }} />
        </ListItem>
        <ListItem>
          <TextField label="name" variant="standard" fullWidth value={api.name} onChange={(e) => {
            setApiState({ path: api.path, name: e.target.value, type: api.type, value: api.value })
          }} />
        </ListItem>
        <ListItem>
          <TextField label="type" variant="standard" fullWidth value={api.type} onChange={(e) => {
            setApiState({ path: api.path, name: api.name, type: e.target.value, value: api.value })
          }} />
        </ListItem>
        <ListItem>
          <TextField label="value" variant="standard" fullWidth value={api.value} onChange={(e) => {
            setApiState({ path: api.path, name: api.name, type: api.type, value: e.target.value })
          }} />
        </ListItem>
      </List>
      <Box textAlign="right" m={1} sx={{ display: 'flex', justifyContent: 'right', gap: 4 }} >
        {path && <Button variant="contained" onClick={() => { setDeleteDialogOpen(true) }}>
          Delete
        </Button>}
        <Button variant="contained" type="submit" onClick={() => {
          if (path) {
            EbinaAPI.updatePath(api).then((res) => {
              if (res.status === 200) { navigate('..') }
            })
          } else {
            EbinaAPI.createPath(api).then((res) => {
              if (res.status === 200) { navigate('..') }
            })
          }
        }}>
          Save
        </Button>
      </Box>
      <DeleteApiPathDialog path={path!} open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false) }} onDeleted={() => { navigate('..') }} />
    </Box >
  )
}

export default APIEdit
