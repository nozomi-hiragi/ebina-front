import { Dialog, DialogTitle, DialogContent, Typography, DialogActions, Button } from "@mui/material"
import EbinaAPI from "../EbinaAPI"

type DeleteApiPathDialogProps = {
  open: boolean,
  appName: string,
  path: string,
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
        <Typography color='red'>{props.path}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button onClick={(() => {
          EbinaAPI.deleteAPI(props.appName, props.path).then((res) => {
            if (res.status === 200) {
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
