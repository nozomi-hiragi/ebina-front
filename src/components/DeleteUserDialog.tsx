import { Dialog, DialogTitle, DialogContent, Typography, DialogActions, Button } from "@mui/material"
import EbinaAPI from "../EbinaAPI"

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
          EbinaAPI.deleteUsers(props.ids).then((res) => {
            if (res.status === 200 || res.status === 206) {
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
