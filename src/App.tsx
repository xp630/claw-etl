import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import DataSourceList from './pages/DataSourceList';
import DataSourceForm from './pages/DataSourceForm';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';
import ApiList from './pages/ApiList';
import ApiForm from './pages/ApiForm';
import AppList from './pages/AppList';
import AppForm from './pages/AppForm';

function App() {
  // 从localStorage检查登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/" element={isLoggedIn ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/datasources" />} />
          <Route path="datasources" element={<DataSourceList />} />
          <Route path="datasources/new" element={<DataSourceForm />} />
          <Route path="datasources/:id" element={<DataSourceForm />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/new" element={<TaskForm />} />
          <Route path="tasks/:id" element={<TaskForm />} />
          <Route path="apis" element={<ApiList />} />
          <Route path="apis/new" element={<ApiForm />} />
          <Route path="apis/:id" element={<ApiForm />} />
          <Route path="apps" element={<AppList />} />
          <Route path="apps/new" element={<AppForm />} />
          <Route path="apps/:id" element={<AppForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
