import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import DashboardBase from './components/DashboardBase';
import RequireAuth from './components/RequireAuth';
import Enter from './pages/Enter';
import Login from './pages/Login';
import Home from './pages/Home';
import Users from './pages/Users';
import ApiIndex from './pages/API/ApiIndes';
import ApiEdit from './pages/API/ApiEdit';
import EditIndex from './pages/Edit/EditIndex';
import EditEdit from './pages/Edit/EditEdit';
import Setting from './pages/Setting';
import AppsIndex from './pages/Apps/AppsIndex';
import AppsEdit from './pages/Apps/AppsEdit';

function App() {
  return (
    <CssBaseline>
      <BrowserRouter>
        <Routes>
          <Route path='/'>
            <Route index element={<Enter />} />
            <Route path='login' element={<Login />} />
            <Route path='dashboard' element={<RequireAuth><DashboardBase /></RequireAuth>}>
              <Route index element={<Home />} />
              <Route path='users' element={<Users />} />
              <Route path='api'>
                <Route index element={<ApiIndex />} />
                <Route path='edit' element={<ApiEdit />} />
              </Route>
              <Route path='edit'>
                <Route index element={<EditIndex />} />
                <Route path=':path' element={<EditEdit />} />
              </Route>
              <Route path='apps'>
                <Route index element={<AppsIndex />} />
                <Route path=':name' element={<AppsEdit />} />
              </Route>
              <Route path='setting' element={<Setting />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter >
    </CssBaseline >
  );
}

export default App;
