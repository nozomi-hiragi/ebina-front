import { Box, Button, Typography } from "@mui/material"
import { pink } from "@mui/material/colors"
import { useContext } from "react"
import { Link } from "react-router-dom"
import { UserContext } from "../context"

const Enter = () => {
  const userContext = useContext(UserContext)
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
      <Button color="inherit" component={Link} to={userContext.user ? "/dashboard" : "/login"}>Enter</Button>
    </Box>
  )
}

export default Enter
