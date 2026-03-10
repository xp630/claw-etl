import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import DataSourceList from './pages/DataSourceList';
import DataSourceForm from './pages/DataSourceForm';
import TaskList from './pages/TaskList';
import TaskForm from './pages/TaskForm';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" /> : <Login onLogin={() => setIsLoggedIn(true)} />
        } />
        <Route path="/" element={isLoggedIn ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/datasources" />} />
          <Route path="datasources" element={<DataSourceList />} />
          <Route path="datasources/new" element={<DataSourceForm />} />
          <Route path="datasources/:id" element={<DataSourceForm />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/new" element={<TaskForm />} />
          <Route path="tasks/:id" element={<TaskForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
