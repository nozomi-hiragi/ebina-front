import { Button, Group, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EbinaAPI from "../../EbinaAPI";

const ConstanRun = () => {
  const [cronNames, setCronNames] = useState<string[]>([]);
  const appName = useParams().appName ?? "";

  useEffect(() => {
    EbinaAPI.getCronList(appName).then((ret) => {
      setCronNames(ret);
    });
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
