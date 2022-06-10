import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { Box, Button, FormControl, InputLabel, List, ListItem, MenuItem, Select, TextField } from "@mui/material"
import DeleteApiPathDialog from "../../components/DeleteApiPathDialog";
import EbinaAPI from "../../EbinaAPI";
import { useRecoilValue } from "recoil";
import { appNameSelector, getJsListSelector } from "../../atoms";

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

const typeList = [
  'static',
  'JavaScript',
]

var cacheAppName = ''

const ApiEdit = () => {
  const [api, setApiState] = useState<TypeApi>({ path: "", name: "", type: "", value: "" })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const jsList = useRecoilValue(getJsListSelector)
  const [jsFilename, setJsFilename] = useState<string>('')
  const [jsFuncname, setJsFuncname] = useState<string>('')
  const appName = useRecoilValue(appNameSelector)
  const navigate = useNavigate()
  if (!cacheAppName) cacheAppName = appName

  const query = useQuery()
  const name = query.get('name')

  useEffect(() => {
    if (name) {
      EbinaAPI.getAPI(appName, name).then((res) => {
        if (res.status === 200) {
          const api: TypeApi = res.data
          switch (api.type) {
            case 'JavaScript':
              const args = api.value.split('>')
              setJsFilename(args[0])
              setJsFuncname(args[1])
              break;
          }
          setApiState(api)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  useEffect(() => {
    if (cacheAppName !== appName) {
      cacheAppName = appName
      navigate('..')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName])

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
          <FormControl variant="standard" sx={{ minWidth: 120 }}>
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              label="Type"
              labelId="type-label"
              value={api.type}
              onChange={(e) => { setApiState({ ...api, type: e.target.value }) }}
            >
              {typeList.map((type) => {
                return (<MenuItem key={type} value={type}>{type}</MenuItem>)
              })}
            </Select>
          </FormControl>
        </ListItem>
        {api.type === 'JavaScript'
          ? <>
            <ListItem>
              <FormControl variant="standard" sx={{ minWidth: 120 }}>
                <InputLabel id="js-label">JsFile</InputLabel>
                <Select
                  label="Type"
                  labelId="jslabel"
                  value={jsFilename}
                  onChange={(e) => { setJsFilename(e.target.value) }}
                >
                  {jsList.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                </Select>
              </FormControl>
            </ListItem>
            <ListItem>
              <TextField label="Function" variant="standard" fullWidth value={jsFuncname} onChange={(e) => {
                setJsFuncname(e.target.value)
              }} />
            </ListItem>
          </>
          : <ListItem>
            <TextField label="value" variant="standard" fullWidth value={api.value} onChange={(e) => {
              setApiState({ path: api.path, name: api.name, type: api.type, value: e.target.value })
            }} />
          </ListItem>
        }
      </List>
      <Box textAlign="right" m={1} sx={{ display: 'flex', justifyContent: 'right', gap: 4 }} >
        {name && <Button variant="contained" onClick={() => { setDeleteDialogOpen(true) }}>
          Delete
        </Button>}
        <Button variant="contained" type="submit" onClick={() => {
          switch (api.type) {
            case 'JavaScript':
              api.value = `${jsFilename}>${jsFuncname}`
              break;
          }
          if (name) {
            EbinaAPI.updateAPI(appName, api).then((res) => {
              if (res.status === 200) { navigate('..') }
            })
          } else {
            EbinaAPI.createPath(appName, api).then((res) => {
              if (res.status === 200) { navigate('..') }
            })
          }
        }}>
          Save
        </Button>
      </Box>
      <DeleteApiPathDialog
        appName={appName}
        name={name!}
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false) }}
        onDeleted={() => { navigate('..') }}
      />
    </Box >
  )
}

export default ApiEdit
