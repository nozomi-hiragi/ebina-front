import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Container, Group, Tooltip, ActionIcon, Title, TextInput } from "@mantine/core"
import { DeviceFloppy, Refresh, Trash } from "tabler-icons-react"
import CopenhagenEditor from "../../components/CopenhagenEditor"
import EbinaAPI from "../../EbinaAPI"
import { useRecoilValue } from "recoil"
import { appNameSelector } from "../../atoms"

let isGettingJs = false
var cacheAppName = ''

const EditEdit = () => {
  const { path } = useParams()
  const [isNew, setIsNew] = useState(path === 'new')
  const [filename, setFilename] = useState(isNew ? '' : path!)

  const [data, setData] = useState<string>('')
  const [editor, setEditor] = useState<any | null>(null)
  const [save, setSave] = useState(false)
  const [refresh, setRefresh] = useState(false)
  const appName = useRecoilValue(appNameSelector)
  if (!cacheAppName) cacheAppName = appName

  const isNeedJs = !isNew
  const lsKey = `JSEdit-${path}`
  const navigate = useNavigate()

  useEffect(() => {
    if (isNeedJs && !isGettingJs) {
      isGettingJs = true
      EbinaAPI.getJS(appName, filename).then((res) => {
        setData(res)
        if (!localStorage.getItem(lsKey)) editor?.setValue(res)
        isGettingJs = false
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
      const result = isNew
        ? EbinaAPI.createJS(appName, filename, editor!.value)
        : EbinaAPI.updateJS(appName, filename, editor!.value)
      result.then(() => {
        setIsNew(false)
        setData(editor!.value)
        localStorage.removeItem(lsKey)
        setSave(false)
      }).catch((err) => { console.log(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save])

  useEffect(() => {
    if (cacheAppName !== appName) {
      cacheAppName = appName
      navigate('..')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName])

  const initValue = localStorage.getItem(lsKey) ?? data

  return (
    <Container>
      <Container sx={{
        height: 70,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }} fluid>
        {isNew ?
          <TextInput placeholder="File name" onChange={(e) => { setFilename(e.target.value) }} /> :
          <Title order={4}>{filename}</Title>
        }
        <Group>
          {!isNew && (<>
            <Tooltip label="Delete">
              <ActionIcon size="xl" radius="xl" onClick={() => {
                if (!isNew) {
                  EbinaAPI.deleteJS(appName, filename).then(() => { navigate('..') })
                }
              }}>
                <Trash />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Refresh">
              <ActionIcon size="xl" radius="xl" onClick={() => { setRefresh(true) }}>
                <Refresh />
              </ActionIcon>
            </Tooltip>
          </>)}
          <Tooltip label="Save">
            <ActionIcon size="xl" radius="xl" onClick={() => { setSave(true) }}>
              <DeviceFloppy />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Container>

      {/* <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, }}>
        {isNew ?
          <A.Input placeholder='filename' onChange={(e) => { setFilename(e.target.value) }} /> :
          <Typography id="tableTitle" sx={{ flex: '1 1 100%' }} variant="h6" component="div">
            {filename}
          </Typography>
        }
        <Group>
          {!isNew && (<>
            <Tooltip label="Delete">
              <UnstyledButton onClick={() => {
                if (!isNew) {
                  EbinaAPI.deleteJS(appName, filename).then(() => { navigate('..') })
                }
              }}>
                <Trash />
              </UnstyledButton>
            </Tooltip>
            <Tooltip label="Refresh">
              <UnstyledButton onClick={() => { setRefresh(true) }}>
                <Refresh />
              </UnstyledButton>
            </Tooltip>
          </>)}
          <Tooltip label="Save">
            <UnstyledButton onClick={() => { setSave(true) }}>
              <DeviceFloppy />
            </UnstyledButton>
          </Tooltip>
        </Group>
      </Toolbar> */}
      <Container m={0}>
        <CopenhagenEditor
          language="javascript"
          rows={30}
          onChange={(editor, value, cursor) => { localStorage.setItem(lsKey, value) }}
          onSave={(editor, value) => { setSave(true) }}
          onMount={(editor, value) => { setEditor(editor) }}
          value={initValue}
        />
      </Container>
    </Container >
  )
}

export default EditEdit
