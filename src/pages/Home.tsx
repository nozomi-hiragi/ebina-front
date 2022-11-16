import { useRecoilValue } from "recoil";
import { Container, Title } from "@mantine/core";
import { getMyInfo } from "../recoil/user";

const Dashboard = () => {
  const user = useRecoilValue(getMyInfo);
  return (
    <Container p={8}>
      <Title order={5}>{user ? `Hello ${user.name}` : "error"}</Title>
    </Container>
  );
};

export default Dashboard;
