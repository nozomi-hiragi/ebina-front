import React from "react"
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material"
import EbinaAPI from "../EbinaAPI"

type CreateDialogProps = {
  open: boolean,
  onClose?: () => void,
  onCreated?: () => void
}

const CreateUserDialog = (props: CreateDialogProps) => {
  const idRef = React.createRef<HTMLInputElement>()
  const nameRef = React.createRef<HTMLInputElement>()
  const passRef = React.createRef<HTMLInputElement>()
  return (<>
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Create User</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="normal" id="id" label="ID" type="id" inputRef={idRef} fullWidth />
        <TextField autoFocus margin="normal" id="name" label="Name" type="name" inputRef={nameRef} fullWidth />
        <TextField autoFocus margin="normal" id="pass" label="Pass" type="password" inputRef={passRef} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button onClick={(() => {
          const user = { id: idRef.current?.value, name: nameRef.current?.value, pass: passRef.current?.value }
          EbinaAPI.userRegist(user).then((res) => {
            if (res.status === 201) {
              props.onClose && props.onClose()
              props.onCreated && props.onCreated()
            } else {
              console.log(res.data)
            }
          })
        })}>Create</Button>
      </DialogActions>
    </Dialog>
  </>)
}

export default CreateUserDialog
