import { useEffect, useRef } from "react";
import { useRecoilState } from 'recoil'
import { Box } from "@mui/system";
import { Button, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { userSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";

const Login = () => {
  const serverRef = useRef<HTMLInputElement>()
  const idRef = useRef<HTMLInputElement>()
  const passRef = useRef<HTMLInputElement>()
  const navigate = useNavigate()
  const [user, setUser] = useRecoilState(userSelector)

  useEffect(() => {
    if (user) { navigate('/dashboard') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
        type="id"
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
        // TODO varidate
        const server = serverRef.current?.value
        const id = idRef.current?.value!
        const pass = passRef.current?.value!
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
        EbinaAPI.setURL(url)
        EbinaAPI.login(id, pass).then((res) => {
          if (res.status !== 200) {
            console.log('error')
            return
          }
          setUser(res.data.user)
        })
      })}>
        Login
      </Button>
    </Box>
  )
}

export default Login
