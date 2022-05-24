import React, { ReactElement, ReactNode, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import { CssBaseline } from '@mui/material';
import { User, UserContext } from './context'
import Users from './pages/Users';
import API from './pages/API';
import DashboardBase from './components/DashboardBase';
import Enter from './pages/Enter';
import APIEdit from './pages/APIEdit';

function App() {
  const userString = localStorage.getItem('user')
  const [user, setUser] = useState(userString ? JSON.parse(userString) : null as User)
  const setUserOverride = (value: React.SetStateAction<User>) => {
    if (value) localStorage.setItem('user', JSON.stringify(value))
    else localStorage.removeItem('user')
    setUser(value)
  }
  const isExpired = !user || (user.exp < Math.floor(Date.now() / 1000))
  if (isExpired && user) { setUserOverride(null) }
  const RequireAuth = ({ children }: { children: ReactNode }): ReactElement => user ? <>{children}</> : <Navigate to='/login' />
  return (
    <CssBaseline>
      <UserContext.Provider value={{ user, setUser: setUserOverride }}>
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
      </UserContext.Provider>
    </CssBaseline >
  );
}

export default App;
