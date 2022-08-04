import { Button, Group, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { appNameSelector } from "../../atoms";
import EbinaAPI from "../../EbinaAPI";

const ConstanRun = () => {
  const [cronNames, setCronNames] = useState<string[]>([]);
  const appName = useRecoilValue(appNameSelector);

  useEffect(() => {
    EbinaAPI.getCronList(appName).then((ret) => {
      setCronNames(ret);
    });
  }, [appName]);

  return (
    <Stack>
      <Group position="apart">
        <Title order={3}>Constant run</Title>
        <Button component={Link} to="new">New</Button>
      </Group>
      {cronNames.map((name) => {
        return <Button key={name} component={Link} to={name}>{name}</Button>;
      })}
    </Stack>
  );
};

export default ConstanRun;
