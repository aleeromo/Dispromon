import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLoginNames } from '../api/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginNames, setLoginNames] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    getLoginNames().then((data) => setLoginNames(data.names || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSelectName(name) {
    setUsername(name);
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {loginNames.length > 0 && (
          <div className="mb-4 p-4 bg-dark-card border border-dark-border rounded-monday">
            <p className="text-sm text-gray-400 mb-2">Selecciona un usuario</p>
            <div className="flex flex-wrap gap-2">
              {loginNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelectName(name)}
                  className={`px-3 py-1.5 rounded-monday text-sm border transition-colors ${
                    username === name
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'border-dark-border text-gray-300 hover:bg-dark-hover hover:border-gray-500'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-dark-card border border-dark-border rounded-monday p-6 shadow-lg"
        >
          <h1 className="text-xl font-semibold text-white mb-6 text-center">Iniciar sesión</h1>
          {error && (
            <div className="mb-4 p-3 rounded bg-red-500/20 text-red-400 text-sm">{error}</div>
          )}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm text-gray-400 mb-1">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-transparent outline-none"
              placeholder="admin"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-monday bg-accent text-white font-medium hover:bg-accentHover disabled:opacity-50"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
