import axios from "axios"
import { Dialog, DialogTitle, DialogContent, Typography, DialogActions, Button } from "@mui/material"

type DeleteUserDialogProps = {
  open: boolean,
  ids: string[],
  onClose?: () => void,
  onDeleted?: () => void
}

const DeleteUserDialog = (props: DeleteUserDialogProps) => {
  return (<>
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography variant="h6">
          Delete?
        </Typography>
        {props.ids.map((id) => (<Typography key={id} color='red'>{id}</Typography>))}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button onClick={(() => {
          const url = localStorage.getItem('server')
          axios.delete(url + 'ebina/users/users', { params: { ids: props.ids.join() } }).then((res) => {
            if (res.status === 202) {
              props.onClose && props.onClose()
              props.onDeleted && props.onDeleted()
            } else {
              console.log(res.data)
            }
          })
        })}>Delete</Button>
      </DialogActions>
    </Dialog>
  </>)
}

export default DeleteUserDialog
