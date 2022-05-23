import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { CssBaseline } from '@mui/material';
import { User, UserContext } from './context'

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
  return (
    <CssBaseline>
      <UserContext.Provider value={{ user, setUser: setUserOverride }}>
        <BrowserRouter>
          <Routes>
            <Route path='/'>
              <Route index element={isExpired ? <Home /> : <Dashboard />} />
              <Route path='login' element={<Login />} />
            </Route>
          </Routes>
        </BrowserRouter >
      </UserContext.Provider>
    </CssBaseline >
  );
}

export default App;
