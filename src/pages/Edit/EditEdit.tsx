import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ActionIcon,
  ColorScheme,
  Container,
  Group,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import { DeviceFloppy, Refresh, Trash } from "tabler-icons-react";
import Editor from "@monaco-editor/react";
import Monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  createScript,
  deleteScript,
  getScript,
  updateScript,
} from "../../EbinaAPI/app/script";
import { tokenSelector } from "../../recoil/user";
import { useRecoilValue } from "recoil";

let isGettingJs = false;

const EditEdit = () => {
  const authToken = useRecoilValue(tokenSelector);
  const [colorScheme] = useLocalStorage<ColorScheme>({
    key: "color-scheme",
    defaultValue: useColorScheme(),
    getInitialValueInEffect: true,
  });
  const { path } = useParams();
  const [isNew, setIsNew] = useState(path === "new");
  const [filename, setFilename] = useState(isNew ? "" : path!);

  const [data, setData] = useState<string>("");
  const [editor, setEditor] = useState<
    Monaco.editor.IStandaloneCodeEditor | null
  >(null);
  const [save, setSave] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const appName = useParams().appName ?? "";

  const isNeedJs = !isNew;
  const lsKey = `JSEdit-${path}`;
  const navigate = useNavigate();

  useEffect(() => {
    if (isNeedJs && !isGettingJs) {
      isGettingJs = true;
      getScript(authToken, appName, filename).then((res) => {
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
        ? createScript(authToken, appName, filename, editor!.getValue())
        : updateScript(authToken, appName, filename, editor!.getValue());
      result.then(() => {
        setIsNew(false);
        setData(editor!.getValue());
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
    <Container m={0} h="100%">
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
                    deleteScript(authToken, appName, filename)
                      .then(() => navigate(-1))}
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
      <Editor
        height="90%"
        defaultLanguage="typescript"
        defaultValue={initValue}
        theme={colorScheme === "light" ? "light" : "vs-dark"}
        onChange={(v, e) => localStorage.setItem(lsKey, v ?? "")}
        onMount={(editor, monaco) => setEditor(editor)}
      />
    </Container>
  );
};

export default EditEdit;
