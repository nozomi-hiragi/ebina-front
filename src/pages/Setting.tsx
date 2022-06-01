import { Divider, FormControl, InputLabel, List, ListItem, ListItemButton, ListItemText, MenuItem, Select, TextField } from "@mui/material"
import EbinaAPI from "../EbinaAPI"
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import { useEffect, useState } from 'react'

const Setting = () => {
  const [deviceName, setDeviceName] = useState('')
  const [waNames, setWaNames] = useState<string[]>([])
  const [selectedNames, setSelectedNames] = useState<string[]>([])
  const [refreshDevices, setRefreshDevices] = useState(true)

  useEffect(() => {
    if (refreshDevices) {
      setRefreshDevices(false)
      EbinaAPI.getWebAuthnDeviceNames().then((res) => {
        if (res.status === 200) { setWaNames(res.data) }
      })
    }
  }, [refreshDevices])

  return (
    <List>
      <ListItem>
        <TextField label="Device Name" variant="standard" fullWidth onChange={(e) => {
          setDeviceName(e.target.value)
        }} />
      </ListItem>
      <ListItemButton onClick={() => {
        EbinaAPI.getWebAuthnRegistOptions().then((res) => {
          if (res.status !== 200) { return console.log('create failed') }
          console.log(res.data)
          return startRegistration(res.data)
        }).then((res) => {
          return EbinaAPI.sendWebAuthnRegistCredential(res, deviceName)
        }).then((res) => {
          setRefreshDevices(true)
          console.log(res)
        }).catch((err) => {
          alert(err)
          console.log('cancel:', err)
        })
      }}>
        <ListItemText primary={'Regist WebAuthn'} />
      </ListItemButton>
      <ListItemButton onClick={() => {
        EbinaAPI.deleteWebAuthnDevice(deviceName).then((res) => {
          if (res.status !== 200) { return console.log('delete failed') }
        }).then((res) => {
          setRefreshDevices(true)
          console.log(res)
        }).catch((err) => {
          alert(err)
          console.log('delete failed:', err)
        })
      }}>
        <ListItemText primary={'Delete Device'} />
      </ListItemButton>
      <Divider />
      <ListItem>
        <FormControl variant="standard" sx={{ minWidth: 200 }}>
          <InputLabel id="names-label">Name</InputLabel>
          <Select
            multiple
            label="Name"
            labelId="names-label"
            value={selectedNames}
            onChange={(e) => {
              const { target: { value }, } = e
              setSelectedNames(typeof value === 'string' ? value.split(',') : value)
            }}
          >
            {waNames.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
          </Select>
        </FormControl>
      </ListItem>
      <ListItemButton onClick={() => {
        EbinaAPI.getWebAuthnVerifyOptions(selectedNames).then((res) => {
          if (res.status !== 200) { return console.log('create failed') }
          console.log(res.data)
          return startAuthentication(res.data)
        }).then((res) => {
          return EbinaAPI.sendWebAuthnVerifyCredential(res)
        }).then((res) => {
          console.log(res)
        }).catch((err) => {
          console.log('cancel:', err)
        })
      }}>
        <ListItemText primary={'Verify WebAuthn'} />
      </ListItemButton>
    </List >
  )
}

export default Setting
