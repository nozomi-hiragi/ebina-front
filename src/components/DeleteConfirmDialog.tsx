import { Dialog, DialogTitle, DialogContent, Typography, DialogActions, Button } from "@mui/material"

type DeleteConfirmDialogProps = {
  open: boolean,
  title: string,
  content: string,
  onClose?: () => void,
  onDelete?: () => void
}

const DeleteConfirmDialog = (props: DeleteConfirmDialogProps) => {
  return (<>
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <Typography variant="h6">
          Delete?
        </Typography>
        <Typography color='red'>{props.content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Cancel</Button>
        <Button onClick={props.onDelete}>Delete</Button>
      </DialogActions>
    </Dialog>
  </>)
}

export default DeleteConfirmDialog
