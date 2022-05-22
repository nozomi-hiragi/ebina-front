import { useRef, useContext } from "react";
import { Box } from "@mui/system";
import { Button, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context";
axios.defaults.withCredentials = true;

const Login = () => {
  const serverRef = useRef<HTMLInputElement>()
  const idRef = useRef<HTMLInputElement>()
  const passRef = useRef<HTMLInputElement>()
  const navigate = useNavigate()
  const userContext = useContext(UserContext)

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: "100vh",
    }}>
      <Typography variant="h3" m={0}>Login</Typography>
      <TextField
        required
        id="outlined-required server"
        label="Server"
        margin="normal"
        inputRef={serverRef}
      />
      <TextField
        required
        id="outlined-required id"
        label="ID"
        margin="normal"
        inputRef={idRef}
      />
      <TextField
        required
        id="outlined-required pass"
        label="PASS"
        type="password"
        margin="normal"
        inputRef={passRef}
      />
      <Button variant="contained" onClick={(() => {
        const server = serverRef.current?.value
        const id = idRef.current?.value
        const pass = passRef.current?.value
        const url = (() => {
          try {
            const url = new URL(server as string)
            return url.toString()
          } catch (err) {
            if (err instanceof TypeError) {
              // url error
              console.log('URL error')
            }
            return ''
          }
        })()
        axios.post(url + 'ebina/user/login', { id: id, pass: pass }).then((res) => {
          if (res.status !== 200) {
            console.log('error')
            return
          }
          localStorage.setItem('server', url)
          axios.post(url + 'ebina/user/verify').then((res) => {
            if (res.status !== 200) {
              console.log('error')
              return
            }
            userContext.setUser(res.data)
            localStorage.setItem('user', JSON.stringify(res.data))
            navigate('/')
          })
        })
      })}>
        Login
      </Button>
    </Box>
  )
}

export default Login
