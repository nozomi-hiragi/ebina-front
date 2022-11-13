import {
  AppShell,
  Button,
  Container,
  Group,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import { Link } from "react-router-dom";
import EbinaHeader from "../components/EbinaHeader";
import { useMediaQuery } from "@mantine/hooks";
import { useRecoilValue } from "recoil";
import { userSelector } from "../recoil/user";

const Enter = () => {
  const { colorScheme } = useMantineColorScheme();
  const user = useRecoilValue(userSelector);
  const isLrg = useMediaQuery("(min-width: 768px)");
  return (
    <AppShell header={<EbinaHeader />}>
      <Container
        size={700}
        pt={isLrg ? 200 : 150}
        sx={{ "white-space": "nowrap" }}
      >
        <Title weight={900}>
          かんたん<Text
            component="span"
            variant="gradient"
            gradient={{ from: "pink", to: "red" }}
            inherit
          >
            APIサーバー<wbr />管理<wbr />アプリ
          </Text>
          <br />的なやつ
        </Title>
        <Text mt="xl">
          関数の作成、<wbr />呼び出し口の設定、<wbr />APIへのルーティング、などを<wbr />Web上で<wbr />操作したいので<wbr />作りました。
        </Text>
        <Group mt="xl">
          <Button
            size="xl"
            variant="gradient"
            gradient={{ from: "pink", to: "red" }}
            sx={{ height: 50 }}
            component={Link}
            to={user ? "/dashboard" : "/login"}
          >
            {user ? "Dashboard" : "Login"}
          </Button>
          <Button
            size="xl"
            variant="outline"
            color={colorScheme === "dark" ? "gray" : "dark"}
            sx={{ height: 50 }}
            component={Link}
            to="/getting-started"
          >
            はじめかた
          </Button>
        </Group>
      </Container>
    </AppShell>
  );
};

export default Enter;
