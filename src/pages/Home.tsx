import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useContext } from "react";
import { UserContext } from "../context";

const Dashboard = () => {
  const userContext = useContext(UserContext)

  return (
    <Box p={1} >
      <Typography paragraph>
        Hello {userContext.user?.name}
      </Typography>
    </Box>
  )
}

export default Dashboard
