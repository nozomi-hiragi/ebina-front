import { ReactNode, useEffect } from 'react';
import { useSetRecoilState } from 'recoil'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import * as LS from './localstorageDelegate';
import { User, userSelector } from './atoms';
import DashboardBase from './components/DashboardBase';
import Enter from './pages/Enter';
import Login from './pages/Login';
import Home from './pages/Home';
import Users from './pages/Users';
import API from './pages/API';
import APIEdit from './pages/APIEdit';

function App() {
  const userStr = LS.get(LS.ITEM.User)
  const user: User = userStr ? JSON.parse(userStr) : null
  const isLogedin = user && user.exp > Math.floor(Date.now() / 1000)
  const setUser = useSetRecoilState(userSelector)
  useEffect(() => setUser(user), [setUser, user])
  const RequireAuth = ({ children }: { children: ReactNode }) => isLogedin ? <>{children}</> : <Navigate to='/login' />
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
                <Route index element={<API />} />
                <Route path='edit' element={<APIEdit />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter >
    </CssBaseline >
  );
}

export default App;
