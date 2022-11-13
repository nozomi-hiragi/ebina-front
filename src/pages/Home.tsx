import { useRecoilValue } from "recoil";
import { Container, Title } from "@mantine/core";
import { userSelector } from "../recoil/user";

const Dashboard = () => {
  const user = useRecoilValue(userSelector);
  return (
    <Container p={8}>
      <Title order={5}>
        Hello {user?.name}
      </Title>
    </Container>
  );
};

export default Dashboard;
