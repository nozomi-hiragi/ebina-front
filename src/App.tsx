import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { useColorScheme, useLocalStorage } from "@mantine/hooks";
import DashboardBase from "./components/DashboardBase";
import RequireAuth from "./components/RequireAuth";
import Entrance from "./pages/Entrance";
import GettingStarted from "./pages/GettingStarted";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Members from "./pages/Members";
import ApiIndex from "./pages/API/ApiIndes";
import ApiEdit from "./pages/API/ApiEdit";
import EditIndex from "./pages/Edit/EditIndex";
import EditEdit from "./pages/Edit/EditEdit";
import Setting from "./pages/Setting";
import AppsIndex from "./pages/Apps/AppsIndex";
import AppsEdit from "./pages/Apps/AppsEdit";
import Database from "./pages/database/Database";
import Collection from "./pages/database/Collection";
import ConstanRun from "./pages/ConstantRun/ConstantRun";
import ConstanRunDetail from "./pages/ConstantRun/ConstantRunDetail";
import Routing from "./pages/Routing/Routing";

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
        <BrowserRouter basename={process.env.PUBLIC_URL}>
          <Routes>
            <Route path="/">
              <Route index element={<Entrance />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="login" element={<Login />} />
              <Route
                path="dashboard"
                element={
                  <RequireAuth>
                    <DashboardBase />
                  </RequireAuth>
                }
              >
                <Route index element={<Home />} />
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
                      <Route path=":cronName" element={<ConstanRunDetail />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="database">
                  <Route index element={<Database />} />
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
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App;
