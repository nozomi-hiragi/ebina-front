import { Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { getDocments } from "../../EbinaAPI/database";
import { tokenSelector } from "../../recoil/user";

const Collection = () => {
  const authToken = useRecoilValue(tokenSelector);
  const dbName = useParams().dbName;
  const collectuonName = useParams().colName;

  const [ret, setret] = useState<any>();

  useEffect(() => {
    if (!dbName || !collectuonName) {
      setret("error");
      return;
    }
    getDocments(authToken, dbName, collectuonName).then((ret) => setret(ret));
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
