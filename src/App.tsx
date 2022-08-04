import { BrowserRouter, Route, Routes } from "react-router-dom";
import DashboardBase from "./components/DashboardBase";
import RequireAuth from "./components/RequireAuth";
import Enter from "./pages/Enter";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Users from "./pages/Users";
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

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/">
          <Route index element={<Enter />} />
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
            <Route path="users" element={<Users />} />
            <Route path="api">
              <Route index element={<ApiIndex />} />
              <Route path="edit" element={<ApiEdit />} />
            </Route>
            <Route path="edit">
              <Route index element={<EditIndex />} />
              <Route path=":path" element={<EditEdit />} />
            </Route>
            <Route path="database">
              <Route index element={<Database />} />
              <Route path=":dbName/:colName" element={<Collection />} />
            </Route>
            <Route path="apps">
              <Route index element={<AppsIndex />} />
              <Route path=":name" element={<AppsEdit />} />
            </Route>
            <Route path="setting" element={<Setting />} />
            <Route path="constantrun">
              <Route index element={<ConstanRun />} />
              <Route path=":cronName" element={<ConstanRunDetail />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
