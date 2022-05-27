import { useRecoilValue } from 'recoil'
import { Box, Button, Typography } from "@mui/material"
import { pink } from "@mui/material/colors"
import { Link } from "react-router-dom"
import { userSelector } from "../atoms"

const Enter = () => {
  const user = useRecoilValue(userSelector)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: pink[200],
        height: "100vh",
      }}>
      <Typography variant="h1">EbinaStation</Typography>
      <Button color="inherit" component={Link} to={user ? "/dashboard" : "/login"}>Enter</Button>
    </Box>
  )
}

export default Enter
