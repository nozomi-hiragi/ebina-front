import { Dialog, DialogTitle, DialogContent, Typography, DialogActions, Button } from "@mui/material"
import EbinaAPI from "../EbinaAPI"

type DeleteApiPathDialogProps = {
  open: boolean,
  appName: string,
  name: string,
  onClose?: () => void,
  onDeleted?: () => void
}

const DeleteApiPathDialog = (props: DeleteApiPathDialogProps) => {
  return (<>
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography variant="h6">
          Delete?
        </Typography>
        <Typography color='red'>{props.name}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button onClick={(() => {
          EbinaAPI.deleteAPI(props.appName, props.name).then((res) => {
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

export default DeleteApiPathDialog
