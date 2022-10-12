import {
  ActionIcon,
  AppShell,
  Button,
  Code,
  Container,
  CopyButton,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
  useMantineColorScheme,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import {
  BrandDeno,
  BrandDocker,
  BrandGithub,
  Check,
  Copy,
} from "tabler-icons-react";
import EbinaHeader from "../components/EbinaHeader";

const CopyableCode = ({ code }: { code: string }) => {
  return (
    <Group spacing={0}>
      <Code>
        {code}
      </Code>
      <CopyButton value={code} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip
            label={copied ? "Copied" : "Copy"}
            withArrow
            position="right"
          >
            <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
};

const GettingStarted = () => {
  const [eula, setEULA] = useLocalStorage<string>({
    key: "eula",
    defaultValue: "",
    getInitialValueInEffect: true,
  });
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <AppShell header={<EbinaHeader />}>
      <Container mb="xl">
        <Title>これはなにか</Title>
        <Text>
          作者が欲しくて作ったものです。なので、あまり他の人の使用を想定されてない部分が多いかと思います。動作としては、設置したサーバー内でDockerコンテナを起動して、その中でdenoのAPIサーバーを起動させる的な物になります。Dockerの操作をする"本部"と、denoアプリの作成などをする"工場"と、それらにルーティングするNginxコンテナの"人事"の3部構成になっています。
        </Text>
      </Container>

      <Container>
        <Title>EULA(End User License Agreement(利用規約))</Title>
        <Text>
          このアプリはオープンソースであり、セキュリティ的に危険な場合があります。このアプリを使用して起きた一切の問題は、このアプリの作成に関わった者は責任を負わず、使用者が責任を負う事に同意できる場合にのみ使用することができます。<br />
          その他、使用されてる各コードのライセンスも適宜確認して自己判断の元使用してください。
        </Text>
        <Group position="center" mt="xl">
          {!eula &&
            (
              <Button
                color="red"
                onClick={() => setEULA(`agree:${new Date().toISOString()}`)}
              >
                Agree
              </Button>
            )}
        </Group>
      </Container>

      {eula &&
        (
          <Container>
            <Title>使い始め方</Title>

            <Container px={0} py={16}>
              <Title order={4}>
                必要ソフトをインストールする
              </Title>
              <Text>
                サーバーアプリを動かすために必要です。
              </Text>
              <Stack align="start" spacing="xs">
                <Button
                  sx={{ height: 28 }}
                  variant="outline"
                  radius="xl"
                  leftIcon={<BrandDeno size={24} />}
                  color="gray"
                  component="a"
                  href="https://deno.land/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  deno
                </Button>
                <Button
                  sx={{ height: 28 }}
                  variant="outline"
                  radius="xl"
                  leftIcon={<BrandDocker size={24} />}
                  color="blue"
                  component="a"
                  href="https://www.docker.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  docker
                </Button>
              </Stack>
            </Container>

            <Container px={0} py={16}>
              <Title order={4}>
                アプリを取得する
              </Title>
              <Text>
                クローンします
              </Text>
              <Stack align="start" spacing="xs">
                <Button
                  sx={{ height: 28 }}
                  variant="outline"
                  radius="xl"
                  leftIcon={<BrandGithub size={24} />}
                  color={isDark ? "gray.0" : "gray.9"}
                  component="a"
                  href="https://github.com/nozomi-hiragi/ebina-station"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ebina-station
                </Button>
              </Stack>
            </Container>

            <Container px={0} py={16}>
              <Title order={4}>
                起動する
              </Title>
              <Text>
                クローンした場所に行き、初期化スクリプトを実行します。
              </Text>
              <CopyableCode code="cd ebina-station" />
              <CopyableCode code="./initEbinaStation.sh" />
              <Text>
                完了したら、起動させます。
              </Text>
              <CopyableCode code="./startEbinaStation.sh" />
              <Text>
                その後、<Code>{`ok from {IPアドレス}`}</Code>と表示されてれば起動は完了しています。
              </Text>
            </Container>

            <Container px={0} py={16}>
              <Title order={4}>
                アカウントを作る
              </Title>
              <Text>
                前の手順で表示されたあとに、アカウント作成のコマンドを入れます。
              </Text>
              <CopyableCode code="create member -u {ユーザー名} -i {ID} -p {パスワード}" />
            </Container>

            <Container px={0} py={16}>
              <Title order={4}>ログインする</Title>
              <Text>
                サイトEbinaStation(当サイト)へ行き、右上のLoginからログインできます。<br />
                Serverにはアプリを入れたサーバーのIPアドレスを、IDにはアカウント作成時に指定したIDを入力してLoginボタンを押します。<br />
                ID入力欄の下にPassword入力窓が出るので、アカウント作成時に指定したパスワードの入力してサイドLoginボタンを押す事でログインできます。<br />
                デフォルトのポートは3456です。<Code>
                  ebina-station/settings.json/port
                </Code>から変更できます。
              </Text>
            </Container>

            <Container px={0} py={16}>
              <Title order={4}>ノリで使う</Title>
              <Text>
                現在の使い方の説明はここまでにしたいと思います。<br />
                使い方はサーバー側のコードを読んでノリで使ってみてください。<br />
                基本的にはebina-stationディレクトリ直下のprojectフォルダの中身をこねこねして使います。<br />
                <a
                  href="https://github.com/nozomi-hiragi/ebina-front"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  フロント側
                </a>もGitHubに上がっているので、自分でホスティングしたい場合はそちらも見てみてください。<br />
                <Code>
                  ebina-station/project/settings.json/origins
                </Code>にURLを足せばCrossも大丈夫だと思います。 <br />
                ローカルからでも使えます。<br />
                Linuxであればデーモン用にserviceファイルを初期化スクリプト内で作ってるはずなので、使いたい人は確認してみてください。
              </Text>
            </Container>
          </Container>
        )}
    </AppShell>
  );
};

export default GettingStarted;
