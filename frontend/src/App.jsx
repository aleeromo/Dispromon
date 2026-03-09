import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import DirectorioPage from './pages/DirectorioPage';
import Login from './pages/Login';
import GestionUsuarios from './pages/GestionUsuarios';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="proyectos/:folderId/board" element={<DirectorioPage />} />
        <Route path="proyectos/:folderId" element={<DirectorioPage />} />
        <Route path="cliente/:workspaceId/:folderId/board" element={<DirectorioPage />} />
        <Route path="cliente/:workspaceId/:folderId" element={<DirectorioPage />} />
        <Route path="gestion-usuarios" element={<GestionUsuarios />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
