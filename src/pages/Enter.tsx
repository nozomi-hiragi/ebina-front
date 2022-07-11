import { useRecoilValue } from 'recoil'
import { Button, Center, Space, Title } from '@mantine/core'
import { Link } from "react-router-dom"
import { userSelector } from "../atoms"

const Enter = () => {
  const user = useRecoilValue(userSelector)
  return (
    <Center
      sx={{
        flexDirection: "column",
        backgroundColor: "pink",
        height: "100vh",
      }}>
      <Title order={1}>EbinaStation</Title>
      <Space h="xl" />
      <Button color="pink" component={Link} to={user ? "/dashboard" : "/login"}>Enter</Button>
    </Center>
  )
}

export default Enter
