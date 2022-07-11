import { Button, Divider, Group, MultiSelect, TextInput } from "@mantine/core"
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
    <Group m={0} direction="column" grow>
      <TextInput
        placeholder="Device Name"
        label="Device Name"
        onChange={(e) => {
          setDeviceName(e.target.value)
        }}
      />
      <Button
        disabled={!deviceName}
        onClick={() => {
          EbinaAPI.getWebAuthnRegistOptions().then((res) =>
            startRegistration(res)
          ).then((res) =>
            EbinaAPI.sendWebAuthnRegistCredential(res, deviceName)
          ).then(() => {
            setRefreshDevices(true)
          }).catch((err) => { alert(err) })
        }}>
        Regist WebAuthn
      </Button>
      <Button
        disabled={!deviceName}
        onClick={() => {
          EbinaAPI.deleteWebAuthnDevice(deviceName).then((res) => {
            setRefreshDevices(true)
          }).catch((err) => { alert(err) })
        }}>
        Delete Device
      </Button>
      <Divider />
      <MultiSelect
        label="Devices"
        data={waNames}
        placeholder="Pick all that you like"
        defaultValue={waNames}
        clearButtonLabel="Clear selection"
        clearable
        onChange={(e) => {
          setSelectedNames(e)
        }}

      />
      <Button
        disabled={selectedNames.length === 0}
        onClick={() => {
          EbinaAPI.getWebAuthnVerifyOptions(selectedNames).then((res) =>
            startAuthentication(res)
          ).then((res) =>
            EbinaAPI.sendWebAuthnVerifyCredential(res)
          ).catch((err) => { alert(err) })
        }}>
        Verify WebAuthn
      </Button>
    </Group >
  )
}

export default Setting
