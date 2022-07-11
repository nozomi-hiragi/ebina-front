import { Affix, Button, Container, Group, Modal, Text, TextInput, Title } from "@mantine/core"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useSetRecoilState } from "recoil"
import { DeviceFloppy, Trash } from "tabler-icons-react"
import { appNameListSelector } from "../../atoms"
import EbinaAPI from "../../EbinaAPI"

const AppsEdit = () => {
  const navigate = useNavigate()
  const setAppNameList = useSetRecoilState(appNameListSelector)
  const [appName, setAppName] = useState(useParams().name ?? 'new')
  const [isNew] = useState(appName === 'new')
  const [isOpenDialog, setIsOpenDialog] = useState<boolean>(false)
  return (<>
    <Container p={8}>
      {isNew
        ? <TextInput id="appName" label="App Name" onChange={(e) => setAppName(e.target.value)} />
        : <Title order={2}>{isNew ? 'New App' : appName}</Title>
      }
    </Container>
    {!isNew && <Group p={8} onClick={() => { setIsOpenDialog(true) }}>
      <Trash />
      <Text>
        Delete
      </Text>
    </Group>}
    {isNew && <Affix position={{ bottom: 20, right: 20 }}>
      <Button sx={{ width: 50, height: 50 }} p={0} radius="xl" onClick={() => {
        if (isNew) {
          EbinaAPI.createApp(appName).then((res) => {
            setAppNameList([])
            navigate('..')
          })
        }
      }}>
        <DeviceFloppy />
      </Button>
    </Affix>}
    <Modal
      opened={isOpenDialog}
      onClose={() => setIsOpenDialog(false)}
      title={`Delete APP`}
    >
      <Text color="red">{`Delete "${appName}"?`}</Text>
      <Group position="right">
        <Button onClick={() => setIsOpenDialog(false)}>Cancel</Button>
        <Button onClick={(() => {
          EbinaAPI.deleteApp(appName).then(() => {
            setAppNameList([])
            navigate('..')
          }).catch((err) => { console.log(err) })
        })}>Delete</Button>
      </Group>
    </Modal>
  </>)
}

export default AppsEdit
