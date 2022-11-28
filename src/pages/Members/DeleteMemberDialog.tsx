import { Button, Group, Modal, ModalProps, Text } from "@mantine/core";

interface DeleteMemberDialogProps extends Omit<ModalProps, "title"> {
  members: string[];
  onDelete: () => boolean | undefined | void;
}
const DeleteMemberDialog = (props: DeleteMemberDialogProps) => {
  return (
    <Modal {...props} title="Delete Member">
      <Text color="red">{`Delete "${props.members}"?`}</Text>
      <Group position="right">
        <Button onClick={props.onClose}>Cancel</Button>
        <Button
          onClick={() => {
            if (props.onDelete()) props.onClose();
          }}
        >
          Delete
        </Button>
      </Group>
    </Modal>
  );
};

export default DeleteMemberDialog;
