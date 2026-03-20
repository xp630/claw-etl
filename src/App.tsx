import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
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
import ApiAccessLog from './pages/ApiAccessLog';
import FeatureList from './pages/FeatureList';
import FeatureForm from './pages/FeatureForm';
import DynamicDataGrid from './pages/DynamicDataGrid';
import DictList from './pages/DictList';
import DictForm from './pages/DictForm';
import SystemConfigList from './pages/SystemConfigList';
import SystemConfigForm from './pages/SystemConfigForm';
import RoleList from './pages/RoleList';
import RoleForm from './pages/RoleForm';
import UserList from './pages/UserList';
import UserForm from './pages/UserForm';
import MenuList from './pages/MenuList';
import MenuForm from './pages/MenuForm';

function App() {
  // 从localStorage检查登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <ThemeProvider>
      <HashRouter>
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
          <Route path="apis/log" element={<ApiAccessLog />} />
          <Route path="apps" element={<AppList />} />
          <Route path="apps/new" element={<AppForm />} />
          <Route path="apps/:id" element={<AppForm />} />
          <Route path="features" element={<FeatureList />} />
          <Route path="features/new" element={<FeatureForm />} />
          <Route path="features/:id" element={<FeatureForm />} />
          <Route path="dict" element={<DictList />} />
          <Route path="dict/new" element={<DictForm />} />
          <Route path="dict/:id" element={<DictForm />} />
          <Route path="config" element={<SystemConfigList />} />
          <Route path="config/new" element={<SystemConfigForm />} />
          <Route path="config/:id" element={<SystemConfigForm />} />
          <Route path="roles" element={<RoleList />} />
          <Route path="roles/new" element={<RoleForm />} />
          <Route path="roles/:id" element={<RoleForm />} />
          <Route path="menus" element={<MenuList />} />
          <Route path="menus/new" element={<MenuForm />} />
          <Route path="menus/:id" element={<MenuForm />} />
          <Route path="users" element={<UserList />} />
          <Route path="users/new" element={<UserForm />} />
          <Route path="users/:id" element={<UserForm />} />
          <Route path="dynamic/:code" element={<DynamicDataGrid />} />
        </Route>
      </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
