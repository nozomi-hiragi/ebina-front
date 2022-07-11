import { ActionIcon, Affix, Button, Container, Divider, Group, Text, UnstyledButton } from "@mantine/core"
import { Plus, Refresh } from "tabler-icons-react"
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
      EbinaAPI.getJSList(appName).then((list) => { setFileList(list) })
      setRefreshState(false)
      cacheAppName = appName
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshState, appName])

  return (
    <Container>
      <Container sx={{
        height: 70,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }} fluid>
        <Text size="xl" weight={50}>Edit</Text>
        <ActionIcon size="xl" radius="xl" onClick={() => { setRefreshState(true) }}>
          <Refresh />
        </ActionIcon>
      </Container>
      <Divider mb={8} />
      <Group direction="column" grow>
        {fileList.map((item) => (
          <UnstyledButton key={item} component={Link} to={`${item}`}>
            {item}
          </UnstyledButton>
        ))}
      </Group>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Button sx={{ width: 50, height: 50 }} p={0} radius="xl" component={Link} to="new">
          <Plus />
        </Button>
      </Affix>
    </Container>
  )
}

export default EditIndex
