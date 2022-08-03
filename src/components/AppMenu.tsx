import { MouseEventHandler, Suspense } from "react";
import { Link } from "react-router-dom";
import { Button, Select, Stack } from "@mantine/core";
import { useRecoilState } from "recoil";
import { appNameListSelector, appNameSelector } from "../atoms";
import EbinaAPI from "../EbinaAPI";

const AppSelect = () => {
  const [appNameList, setAppNameList] = useRecoilState(appNameListSelector);
  const [appName, setAppName] = useRecoilState(appNameSelector);

  return (
    <Select
      label="App"
      data={appNameList}
      placeholder="Select app"
      nothingFound="Nothing found"
      searchable
      creatable
      getCreateLabel={(query) => `Create "${query}"`}
      value={appName}
      onCreate={(newName) => {
        EbinaAPI.createApp(newName).then(() => {
          setAppNameList([...appNameList, newName]);
          setAppName(newName);
        });
        return newName;
      }}
      onChange={(v) => {
        if (appNameList.includes(v ?? "")) setAppName(v!);
      }}
    />
  );
};

type AppMenuProps = {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const AppMenu: React.FC<AppMenuProps> = (props: AppMenuProps) => {
  const appMenuItems = [
    { label: "API", path: "api" },
    { label: "Edit", path: "edit" },
  ];

  return (
    <Stack
      align="center"
      justify="flex-start"
      spacing="xs"
      sx={{ width: "190", height: "100%" }}
    >
      <Suspense>
        <AppSelect />
      </Suspense>
      {appMenuItems.map((item) => (
        <Button<typeof Link>
          key={item.label}
          sx={{ width: 200 }}
          component={Link}
          to={item.path}
          onClick={props.onClick}
        >
          {item.label}
        </Button>
      ))}
    </Stack>
  );
};

export default AppMenu;
