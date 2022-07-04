import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { Box, Button, FormControl, InputLabel, List, ListItem, MenuItem, Select, TextField } from "@mui/material"
import DeleteApiPathDialog from "../../components/DeleteApiPathDialog";
import EbinaAPI from "../../EbinaAPI";
import { useRecoilValue } from "recoil";
import { appNameSelector, getJsListSelector } from "../../atoms";
import { ApiTypeList, TypeApi, TypeApiMethods, TypeApiTypes } from "../../types";

function useQuery() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

const methodList = [
  'get', 'head', 'post', 'put', 'delete', 'options', 'patch',
]

var cacheAppName = ''

const ApiEdit = () => {
  const [path, setPath] = useState('')
  const [api, setApiState] = useState<TypeApi>({ name: '', method: 'get', type: 'static', value: '' })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const jsList = useRecoilValue(getJsListSelector)
  const [jsFilename, setJsFilename] = useState<string>('')
  const [jsFuncname, setJsFuncname] = useState<string>('')
  const appName = useRecoilValue(appNameSelector)
  const navigate = useNavigate()
  if (!cacheAppName) cacheAppName = appName

  const query = useQuery()
  const queryPath = query.get('path')

  useEffect(() => {
    if (queryPath) {
      EbinaAPI.getAPI(appName, queryPath).then((api) => {
        switch (api.type) {
          case 'JavaScript':
            const args = api.value.split('>')
            setJsFilename(args[0])
            setJsFuncname(args[1])
            break;
        }
        setPath(queryPath)
        setApiState(api)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPath])

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
          <TextField label="path" variant="standard" fullWidth value={path} disabled={queryPath !== null} onChange={(e) => {
            setPath(e.target.value)
          }} />
        </ListItem>
        <ListItem>
          <TextField label="name" variant="standard" fullWidth value={api.name} onChange={(e) => {
            setApiState({ ...api, name: e.target.value })
          }} />
        </ListItem>
        <ListItem>
          <FormControl variant="standard" sx={{ minWidth: 120 }}>
            <InputLabel id="method-label">Method</InputLabel>
            <Select
              label="Method"
              labelId="method-label"
              value={api.method}
              onChange={(e) => { setApiState({ ...api, method: e.target.value as TypeApiMethods }) }}
            >
              {methodList.map((method) => {
                return (<MenuItem key={method} value={method}>{method}</MenuItem>)
              })}
            </Select>
          </FormControl>
        </ListItem>
        <ListItem>
          <FormControl variant="standard" sx={{ minWidth: 120 }}>
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              label="Type"
              labelId="type-label"
              value={api.type}
              onChange={(e) => { setApiState({ ...api, type: e.target.value as TypeApiTypes }) }}
            >
              {ApiTypeList.map((type) => {
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
              setApiState({ ...api, value: e.target.value })
            }} />
          </ListItem>
        }
      </List>
      <Box textAlign="right" m={1} sx={{ display: 'flex', justifyContent: 'right', gap: 4 }} >
        {queryPath && <Button variant="contained" onClick={() => { setDeleteDialogOpen(true) }}>
          Delete
        </Button>}
        <Button variant="contained" type="submit" onClick={() => {
          switch (api.type) {
            case 'JavaScript':
              api.value = `${jsFilename}>${jsFuncname}`
              break;
          }
          if (queryPath) {
            EbinaAPI.updateAPI(appName, queryPath, api).then((res) => { navigate('..') })
          } else {
            EbinaAPI.createPath(appName, path, api).then((res) => { navigate('..') })
          }
        }}>
          Save
        </Button>
      </Box>
      <DeleteApiPathDialog
        appName={appName}
        path={queryPath!}
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false) }}
        onDeleted={() => { navigate('..') }}
      />
    </Box >
  )
}

export default ApiEdit
