import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { CssBaseline } from '@mui/material';
import { UserContext } from './context'

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') ?? '{}') as { [name: string]: any })
  return (
    <CssBaseline>
      <UserContext.Provider value={{ user, setUser } as any}>
        <BrowserRouter>
          <Routes>
            <Route path='/'>
              <Route index element={user.id ? <Dashboard /> : <Home />} />
              <Route path='login' element={<Login />} />
            </Route>
          </Routes>
        </BrowserRouter >
      </UserContext.Provider>
    </CssBaseline>
  );
}

export default App;
