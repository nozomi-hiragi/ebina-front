import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Box, IconButton, Input, Toolbar, Tooltip, Typography } from "@mui/material"
import CopenhagenEditor from "../../components/CopenhagenEditor"
import { Refresh, Save } from "@mui/icons-material"
import EbinaAPI from "../../EbinaAPI"
import Delete from "@mui/icons-material/Delete"

let isGettingJs = false

const EditEdit = () => {
  const { path } = useParams()
  const [isNew, setIsNew] = useState(path === 'new')
  const [filename, setFilename] = useState(isNew ? '' : path!)

  const [data, setData] = useState<string>('')
  const [editor, setEditor] = useState<any | null>(null)
  const [save, setSave] = useState(false)
  const [refresh, setRefresh] = useState(false)

  const isNeedJs = !isNew
  const lsKey = `JSEdit-${path}`
  const navigate = useNavigate()

  useEffect(() => {
    if (isNeedJs && !isGettingJs) {
      isGettingJs = true
      EbinaAPI.getJS(filename).then((res) => {
        if (res.status === 200) {
          setData(res.data)
          if (!localStorage.getItem(lsKey)) editor?.setValue(res.data)
          isGettingJs = false
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (refresh) {
      localStorage.removeItem(lsKey)
      editor?.setValue(data)
      setRefresh(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh])

  useEffect(() => {
    if (save && filename) {
      const result = isNew ? EbinaAPI.createJS(filename, editor!.value) : EbinaAPI.updateJS(filename, editor!.value)
      result.then((res) => {
        if (res.status === 200) {
          setIsNew(false)
          setData(editor!.value)
          localStorage.removeItem(lsKey)
          setSave(false)
        } else {
          console.log(res.data)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save])

  const initValue = localStorage.getItem(lsKey) ?? data

  return (
    <Box>
      <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, }}>
        <Typography id="tableTitle" sx={{ flex: '1 1 100%' }} variant="h6" component="div">
          {isNew ?
            <Input placeholder='filename' onChange={(e) => { setFilename(e.target.value) }} /> : filename
          }
        </Typography>
        {!isNew && (<>
          <Tooltip title="Delete">
            <IconButton onClick={() => {
              if (!isNew) {
                EbinaAPI.deleteJS(filename).then((res) => {
                  if (res.status === 200) { navigate('..') }
                })
              }
            }}>
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={() => { setRefresh(true) }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </>)}
        <Tooltip title="Save">
          <IconButton onClick={() => { setSave(true) }}>
            <Save />
          </IconButton>
        </Tooltip>
      </Toolbar>
      <Box m={1}>
        <CopenhagenEditor
          language="javascript"
          rows={30}
          onChange={(editor, value, cursor) => { localStorage.setItem(lsKey, value) }}
          onSave={(editor, value) => { setSave(true) }}
          onMount={(editor, value) => { setEditor(editor) }}
          value={initValue}
        />
      </Box>
    </Box>
  )
}

export default EditEdit