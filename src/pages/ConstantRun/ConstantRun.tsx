import { Button, Group, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { getCronList } from "../../EbinaAPI/app/cron";
import { tokenSelector } from "../../recoil/user";

const ConstanRun = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [cronNames, setCronNames] = useState<string[]>([]);
  const appName = useParams().appName ?? "";

  useEffect(() => {
    getCronList(authToken, appName).then((ret) => {
      setCronNames(ret);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appName]);

  return (
    <Stack>
      <Group position="apart">
        <Title order={3}>Constant Run</Title>
        <Button component={Link} to="new">New</Button>
      </Group>
      {cronNames.map((name) => {
        return <Button key={name} component={Link} to={name}>{name}</Button>;
      })}
    </Stack>
  );
};

export default ConstanRun;
