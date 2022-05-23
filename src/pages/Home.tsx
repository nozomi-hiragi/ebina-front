import { Typography } from "@mui/material";
import { useContext } from "react";
import DashboardBase from "../components/DashboardBase";
import { UserContext } from "../context";

const Dashboard = () => {
  const userContext = useContext(UserContext)

  return (
    <DashboardBase>
      <Typography paragraph>
        Hello {userContext.user?.name}
      </Typography>
    </DashboardBase>
  )
}

export default Dashboard
