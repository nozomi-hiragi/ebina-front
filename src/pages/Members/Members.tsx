import { useCallback, useMemo, useState } from "react";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import { Group, Stack, Tabs, Text, Title, UnstyledButton } from "@mantine/core";
import { openConfirmModal } from "@mantine/modals";
import { Check, Trash, UserCheck, UserPlus, X } from "tabler-icons-react";
import { payloadSelector, tokenSelector } from "../../recoil/user";
import EbinaAPI from "../../EbinaAPI";
import { getMembers, getTempMembers } from "../../recoil/member";
import RegistMemberDialog from "./RegistMemberDialog";
import DeleteMemberDialog from "./DeleteMemberDialog";
import MembersTable from "./MembersTable";
import { showNotification } from "@mantine/notifications";
import { admitTempMember, denyTempMember } from "../../EbinaAPI/member";

const Members = () => {
  const payload = useRecoilValue(payloadSelector);
  const [members, setMembers] = useRecoilState(getMembers);
  const resetMemebers = useResetRecoilState(getMembers);
  const [tempMemebers, setTempMemebers] = useRecoilState(getTempMembers);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedTempMembers, setSelectedTempMembers] = useState<string[]>([]);
  const [registDialogOpen, setRegistDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const authToken = useRecoilValue(tokenSelector);

  const hasSelectMembers = useMemo(() => selectedMembers.length > 0, [
    selectedMembers,
  ]);
  const hasSelectTempMembers = useMemo(() => selectedTempMembers.length > 0, [
    selectedTempMembers,
  ]);

  const openAdmitModal = useCallback((ids: string[]) =>
    openConfirmModal({
      title: "Admit Temp Member",
      children: <Text size="sm">Admit {ids.join(", ")}?</Text>,
      labels: { confirm: "Admit", cancel: "Cancel" },
      onConfirm: async () => {
        await admitTempMember(authToken, ids).then((successIds) => {
          setTempMemebers(tempMemebers!
            .filter((member) => !successIds.includes(member.id)));
          setSelectedTempMembers([]);
          resetMemebers();
          showNotification({
            title: "Admit success",
            message: `${successIds.join(", ")}`,
            color: "green",
            icon: <Check />,
          });
        }).catch((err: Error) =>
          showNotification({
            title: "Admit failed",
            message: err.message,
            color: "red",
            icon: <X />,
          })
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [tempMemebers]);

  const openDenyModal = useCallback((ids: string[]) =>
    openConfirmModal({
      title: "Deny Temp Member",
      children: <Text size="sm">Admit {ids.join(", ")}?</Text>,
      labels: { confirm: "Deny", cancel: "Cancel" },
      onConfirm: async () => {
        await denyTempMember(authToken, ids).then((successIds) => {
          setTempMemebers(tempMemebers!
            .filter((member) => !successIds.includes(member.id)));
          setSelectedTempMembers([]);
          resetMemebers();
          showNotification({
            title: "Deny success",
            message: `${successIds.join(", ")}`,
            color: "green",
            icon: <Check />,
          });
        }).catch((err: Error) =>
          showNotification({
            title: "Deny failed",
            message: err.message,
            color: "red",
            icon: <X />,
          })
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [tempMemebers]);

  return (
    <Stack>
      <Tabs defaultValue="members">
        <Tabs.List>
          <Tabs.Tab value="members">Members</Tabs.Tab>
          <Tabs.Tab value="tempmembers">Temp Members</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="members" pt="xs">
          <Group position="apart">
            <Title order={4}>Members</Title>
            <UnstyledButton
              onClick={() =>
                hasSelectMembers
                  ? setDeleteDialogOpen(true)
                  : setRegistDialogOpen(true)}
            >
              {hasSelectMembers ? <Trash size={22} /> : <UserPlus size={22} />}
            </UnstyledButton>
          </Group>
          <MembersTable
            myID={payload?.id}
            members={members}
            onChange={setSelectedMembers}
          />
        </Tabs.Panel>
        <Tabs.Panel value="tempmembers" pt="xs">
          <Group position="apart">
            <Title order={4}>Temp Members</Title>
            {hasSelectTempMembers && (
              <Group>
                <UnstyledButton
                  onClick={() => openAdmitModal(selectedTempMembers)}
                >
                  <UserCheck size={22} />
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => openDenyModal(selectedTempMembers)}
                >
                  <Trash size={22} />
                </UnstyledButton>
              </Group>
            )}
          </Group>
          <MembersTable
            members={tempMemebers ?? []}
            onChange={setSelectedTempMembers}
          />
        </Tabs.Panel>
      </Tabs>
      <RegistMemberDialog
        opened={registDialogOpen}
        onClose={() => setRegistDialogOpen(false)}
      />
      <DeleteMemberDialog
        opened={deleteDialogOpen}
        members={selectedMembers}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={() => {
          EbinaAPI.deleteUsers(selectedMembers).then(() => {
            setDeleteDialogOpen(false);
            setMembers(members
              .filter((member) => !selectedMembers.includes(member.id)));
            setSelectedMembers([]);
          }).catch((err) => {
            console.log(err);
          });
        }}
      />
    </Stack>
  );
};

export default Members;
