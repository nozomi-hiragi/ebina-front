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
        setWaNames(res)
      }).catch((err) => { alert(err) })
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
        EbinaAPI.getWebAuthnRegistOptions().then((res) =>
          startRegistration(res)
        ).then((res) =>
          EbinaAPI.sendWebAuthnRegistCredential(res, deviceName)
        ).then(() => {
          setRefreshDevices(true)
        }).catch((err) => { alert(err) })
      }}>
        <ListItemText primary={'Regist WebAuthn'} />
      </ListItemButton>
      <ListItemButton onClick={() => {
        EbinaAPI.deleteWebAuthnDevice(deviceName).then((res) => {
          setRefreshDevices(true)
        }).catch((err) => { alert(err) })
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
        EbinaAPI.getWebAuthnVerifyOptions(selectedNames).then((res) =>
          startAuthentication(res)
        ).then((res) =>
          EbinaAPI.sendWebAuthnVerifyCredential(res)
        ).catch((err) => { alert(err) })
      }}>
        <ListItemText primary={'Verify WebAuthn'} />
      </ListItemButton>
    </List >
  )
}

export default Setting
