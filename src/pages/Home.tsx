import { useRecoilValue } from "recoil";
import { Container, Title } from "@mantine/core";
import { getMyInfo } from "../recoil/user";
import { Suspense } from "react";

const HomeTitle = () => {
  const user = useRecoilValue(getMyInfo);
  return <Title order={5}>{user ? `Hello ${user.name}` : "error"}</Title>;
};

const Dashboard = () => {
  return (
    <Container p={8}>
      <Suspense fallback={<>Loading...</>}>
        <HomeTitle />
      </Suspense>
    </Container>
  );
};

export default Dashboard;
