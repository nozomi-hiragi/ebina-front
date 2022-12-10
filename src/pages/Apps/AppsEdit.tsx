import { Center, NavLink, Paper, Text, Title } from "@mantine/core";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { Trash } from "tabler-icons-react";
import { appNameListSelector } from "../../recoil/atoms";
import { deleteApp } from "../../EbinaAPI/app/app";
import { tokenSelector } from "../../recoil/user";
import { openConfirmModal } from "@mantine/modals";

const AppsEdit = () => {
  const authToken = useRecoilValue(tokenSelector);
  const navigate = useNavigate();
  const setAppNameList = useSetRecoilState(appNameListSelector);
  const appName = useParams().appName;
  if (!appName) return <>404</>;

  const openDeleteModal = () =>
    openConfirmModal({
      title: "Delete App",
      centered: true,
      children: <Text color="red">{`Delete "${appName}"?`}</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () =>
        deleteApp(authToken, appName).then(() => {
          setAppNameList([]);
          navigate(-1);
        }).catch((err) => console.log(err)),
    });

  return (
    <Center>
      <Paper withBorder px={8} py={4} w={200}>
        <Title order={2}>{appName}</Title>
        <NavLink label="API" component={Link} to="api" />
        <NavLink label="Edit" component={Link} to="edit" />
        <NavLink label="Constant Run" component={Link} to="constantrun" />
        <NavLink label="Delete" icon={<Trash />} onClick={openDeleteModal} />
      </Paper>
    </Center>
  );
};

export default AppsEdit;
