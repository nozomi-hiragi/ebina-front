import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ActionIcon,
  Container,
  Group,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { DeviceFloppy, Refresh, Trash } from "tabler-icons-react";
import CopenhagenEditor from "../../components/CopenhagenEditor";
import EbinaAPI from "../../EbinaAPI";

let isGettingJs = false;

const EditEdit = () => {
  const { path } = useParams();
  const [isNew, setIsNew] = useState(path === "new");
  const [filename, setFilename] = useState(isNew ? "" : path!);

  const [data, setData] = useState<string>("");
  const [editor, setEditor] = useState<any | null>(null);
  const [save, setSave] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const appName = useParams().appName ?? "";

  const isNeedJs = !isNew;
  const lsKey = `JSEdit-${path}`;
  const navigate = useNavigate();

  useEffect(() => {
    if (isNeedJs && !isGettingJs) {
      isGettingJs = true;
      EbinaAPI.getScript(appName, filename).then((res) => {
        setData(res);
        if (!localStorage.getItem(lsKey)) editor?.setValue(res);
        isGettingJs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refresh) {
      localStorage.removeItem(lsKey);
      editor?.setValue(data);
      setRefresh(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    if (save && filename) {
      const result = isNew
        ? EbinaAPI.createScript(appName, filename, editor!.value)
        : EbinaAPI.updateScript(appName, filename, editor!.value);
      result.then(() => {
        setIsNew(false);
        setData(editor!.value);
        localStorage.removeItem(lsKey);
        setSave(false);
      }).catch((err) => {
        console.log(err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  const initValue = localStorage.getItem(lsKey) ?? data;

  return (
    <Container m={0}>
      <Group position="apart">
        {isNew
          ? (
            <TextInput
              placeholder="File name"
              onChange={(e) => setFilename(e.target.value)}
            />
          )
          : <Title order={4}>{filename}</Title>}
        <Group>
          {!isNew && (
            <>
              <Tooltip label="Delete">
                <ActionIcon
                  size="xl"
                  radius="xl"
                  onClick={() =>
                    EbinaAPI.deleteScript(appName, filename).then(() =>
                      navigate(-1)
                    )}
                >
                  <Trash />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Refresh">
                <ActionIcon
                  size="xl"
                  radius="xl"
                  onClick={() => setRefresh(true)}
                >
                  <Refresh />
                </ActionIcon>
              </Tooltip>
            </>
          )}
          <Tooltip label="Save">
            <ActionIcon
              size="xl"
              radius="xl"
              onClick={() => setSave(true)}
            >
              <DeviceFloppy />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
      <Container m={0}>
        <CopenhagenEditor
          language="javascript"
          rows={30}
          onChange={(e, v, cursor) => localStorage.setItem(lsKey, v)}
          onSave={(editor, value) => setSave(true)}
          onMount={(editor, value) => setEditor(editor)}
          value={initValue}
        />
      </Container>
    </Container>
  );
};

export default EditEdit;
