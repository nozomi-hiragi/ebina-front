import { Box, Button, Typography } from "@mui/material"
import { pink } from "@mui/material/colors"
import React from "react"
import { Link } from "react-router-dom"

const Home = () => {
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
      <Button color="inherit" component={Link} to="/login">Login</Button>
    </Box>
  )
}

export default Home
