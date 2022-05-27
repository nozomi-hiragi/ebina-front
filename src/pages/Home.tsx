import { useRecoilValue } from 'recoil'
import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { userSelector } from "../atoms";

const Dashboard = () => {
  const user = useRecoilValue(userSelector)
  return (
    <Box p={1} >
      <Typography paragraph>
        Hello {user?.name}
      </Typography>
    </Box>
  )
}

export default Dashboard
