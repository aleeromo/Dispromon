import { useState, useEffect } from 'react';
import { getUsers, register, deleteUser } from '../api/client';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../hooks/useRole';

export default function GestionUsuarios() {
  const { isAdmin } = useRole();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('VENTAS');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (isAdmin) load();
    else setLoading(false);
  }, [isAdmin]);

  async function load() {
    setLoading(true);
    try {
      const list = await getUsers();
      setUsers(list);
    } catch (e) {
      setError(e.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!nombre.trim() || !password) {
      setError('Nombre y contraseña son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      await register(nombre.trim(), password, rol);
      setNombre('');
      setPassword('');
      setRol('VENTAS');
      await load();
    } catch (e) {
      setError(e.message || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`¿Eliminar el usuario "${u.nombre}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    setDeletingId(u.id);
    try {
      await deleteUser(u.id);
      await load();
    } catch (e) {
      setError(e.message || 'Error al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6 text-red-400">
        No tienes permiso para acceder a la gestión de usuarios.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-white mb-6">Gestión de Usuarios</h1>

      <form
        onSubmit={handleCreate}
        className="mb-8 p-4 bg-dark-card border border-dark-border rounded-monday"
      >
        <h2 className="text-lg text-white mb-4">Crear nuevo usuario</h2>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/20 text-red-400 text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombre de usuario</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="usuario"
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white focus:ring-1 focus:ring-accent outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 rounded-monday bg-accent text-white font-medium hover:bg-accentHover disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-dark-card border border-dark-border rounded-monday overflow-hidden">
        <h2 className="text-lg text-white p-4 border-b border-dark-border">Usuarios existentes</h2>
        {loading ? (
          <div className="p-6 text-gray-400">Cargando...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-gray-400">No hay usuarios.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border text-left text-gray-400 text-sm">
                <th className="py-3 px-4 font-medium">Nombre</th>
                <th className="py-3 px-4 font-medium">Rol</th>
                <th className="py-3 px-4 font-medium w-24 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isCurrentUser = user?.id === u.id;
                return (
                  <tr key={u.id} className="border-b border-dark-border last:border-0">
                    <td className="py-3 px-4 text-white">{u.nombre}</td>
                    <td className="py-3 px-4 text-gray-300">{u.rol}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={isCurrentUser || deletingId === u.id}
                        title={isCurrentUser ? 'No puedes eliminar tu propio perfil' : 'Eliminar usuario'}
                        className="p-2 rounded text-gray-500 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                        aria-label="Eliminar usuario"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
