import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import { ModalsProvider } from "@mantine/modals";
import { NotificationsProvider } from "@mantine/notifications";
import {
  Apps,
  ArrowRampRight,
  Database,
  Home,
  Id,
  Settings,
  User,
} from "tabler-icons-react";
import DashboardBase from "./components/DashboardBase";
import Entrance from "./pages/Entrance";
import GettingStarted from "./pages/GettingStarted";
import Login from "./pages/Login";
import TopPage from "./pages/Home";
import Profile from "./pages/Profile/Profile";
import Members from "./pages/Members/Members";
import ApiIndex from "./pages/API/ApiIndes";
import ApiEdit from "./pages/API/ApiEdit";
import EditIndex from "./pages/Edit/EditIndex";
import EditEdit from "./pages/Edit/EditEdit";
import Setting from "./pages/Setting";
import AppsIndex from "./pages/Apps/AppsIndex";
import AppsEdit from "./pages/Apps/AppsEdit";
import DatabasePage from "./pages/database/Database";
import Collection from "./pages/database/Collection";
import ConstanRun from "./pages/ConstantRun/ConstantRun";
import ConstanRunDetail from "./pages/ConstantRun/ConstantRunDetail";
import Routing from "./pages/Routing/Routing";
import Regist from "./pages/Regist";

export const menuItems = [
  { label: "Home", path: "", icon: <Home /> },
  { label: "Profile", path: "profile", icon: <Id /> },
  { label: "Members", path: "members", icon: <User /> },
  { label: "Apps", path: "apps", icon: <Apps /> },
  { label: "Database", path: "database", icon: <Database /> },
  { label: "Routing", path: "routing", icon: <ArrowRampRight /> },
  { label: "Settings", path: "settings", icon: <Settings /> },
];

const pageLabels: { [path: string]: string | undefined } = {
  "dashboard": "Home",
  "api": "API",
  "edit": "Edit",
  "constantrun": "Constant Run",
};

export const getLabelFromPaht = (path: string) =>
  menuItems.find((i) => i.path === path)?.label ??
    pageLabels[path] ?? decodeURI(path);

function App() {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "color-scheme",
    defaultValue: preferredColorScheme,
    getInitialValueInEffect: true,
  });
  const toggleColorScheme = (v?: ColorScheme) =>
    setColorScheme(v || colorScheme === "dark" ? "light" : "dark");

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{ colorScheme }}
        withNormalizeCSS
        withGlobalStyles
      >
        <NotificationsProvider>
          <ModalsProvider>
            <BrowserRouter basename={process.env.PUBLIC_URL}>
              <Routes>
                <Route path="/">
                  <Route index element={<Entrance />} />
                  <Route path="getting-started" element={<GettingStarted />} />
                  <Route path="login" element={<Login />} />
                  <Route path="regist" element={<Regist />} />
                  <Route path="dashboard" element={<DashboardBase />}>
                    <Route index element={<TopPage />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="members" element={<Members />} />
                    <Route path="apps">
                      <Route index element={<AppsIndex />} />
                      <Route path=":appName">
                        <Route index element={<AppsEdit />} />
                        <Route path="api">
                          <Route index element={<ApiIndex />} />
                          <Route path="edit" element={<ApiEdit />} />
                        </Route>
                        <Route path="edit">
                          <Route index element={<EditIndex />} />
                          <Route path=":path" element={<EditEdit />} />
                        </Route>
                        <Route path="constantrun">
                          <Route index element={<ConstanRun />} />
                          <Route
                            path=":cronName"
                            element={<ConstanRunDetail />}
                          />
                        </Route>
                      </Route>
                    </Route>
                    <Route path="database">
                      <Route index element={<DatabasePage />} />
                      <Route path=":dbName/:colName" element={<Collection />} />
                    </Route>
                    <Route path="routing">
                      <Route index element={<Routing />} />
                    </Route>
                    <Route path="settings" element={<Setting />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </ModalsProvider>
        </NotificationsProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App;
