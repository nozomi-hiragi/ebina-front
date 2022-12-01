import { useRecoilValue } from "recoil";
import { Stack, Title } from "@mantine/core";
import { getMyInfo } from "../../recoil/user";
import { useState } from "react";
import APIPanel from "./APIPanel";

const Dashboard = () => {
  const user = useRecoilValue(getMyInfo);
  const [counter, setCounter] = useState(1);
  const [panelFlag, setPanelFlag] = useState(false);

  return (
    <Stack p={8}>
      <Title
        order={5}
        onClick={() => {
          if (panelFlag) return;
          if (counter >= 10) setPanelFlag(true);
          setCounter(counter + 1);
        }}
      >
        {user ? `Hello ${user.name}` : "error"}
      </Title>
      {panelFlag && <APIPanel />}
    </Stack>
  );
};

export default Dashboard;
