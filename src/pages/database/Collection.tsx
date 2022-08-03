import { Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EbinaAPI from "../../EbinaAPI";

const Collection = () => {
  const dbName = useParams().dbName;
  const collectuonName = useParams().colName;

  const [ret, setret] = useState<any>();

  useEffect(() => {
    if (!dbName || !collectuonName) {
      setret("error");
      return;
    }
    EbinaAPI.getDocments(dbName, collectuonName).then((ret) => setret(ret));
    // eslint-disable-next-line
  }, []);

  return (
    <Stack>
      <Title order={3}>{`${dbName}/${collectuonName}`}</Title>
      <pre>
        {JSON.stringify(ret ?? {}, undefined, 2)}
      </pre>
    </Stack>
  );
};

export default Collection;
