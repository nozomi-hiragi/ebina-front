import { useRecoilValue } from 'recoil'
import { userSelector } from "../atoms";
import { Container, Title } from '@mantine/core';

const Dashboard = () => {
  const user = useRecoilValue(userSelector)
  return (
    <Container p={8} >
      <Title order={5}>
        Hello {user?.name}
      </Title>
    </Container>
  )
}

export default Dashboard
