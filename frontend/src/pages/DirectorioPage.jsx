import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ensureBoardForFolder,
  getWorkspaces,
} from '../api/client';
import BoardTable from '../components/board/BoardTable';
import BoardKanban from '../components/board/BoardKanban';
import BoardTimeline from '../components/board/BoardTimeline';
import Breadcrumbs from '../components/Breadcrumbs';

const VIEWS = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'taller', label: 'Taller' },
  { id: 'admin', label: 'Admin' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'calendar', label: 'Calendario' },
];

export default function DirectorioPage() {
  const { folderId, workspaceId: workspaceIdParam } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [folder, setFolder] = useState(null);
  const [view, setView] = useState('ventas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isBoardMode = pathname.endsWith('/board');
  const isClientRoute = Boolean(workspaceIdParam && folderId);

  // Navegación directa: si entramos a una carpeta sin /board, redirigir al board
  useEffect(() => {
    if (folderId && !isBoardMode) {
      if (workspaceIdParam) {
        navigate(`/cliente/${workspaceIdParam}/${folderId}/board`, { replace: true });
      } else {
        navigate(`/proyectos/${folderId}/board`, { replace: true });
      }
    }
  }, [folderId, workspaceIdParam, isBoardMode, navigate]);

  const loadBoard = useCallback(async () => {
    if (!folderId || !isBoardMode) return;

    setLoading(true);
    setError('');
    try {
      const workspaces = await getWorkspaces().catch(() => []);
      const proy = workspaces.find((w) => w.categoria_raiz === 'PROYECTOS' || w.name === 'PROYECTOS');
      const wsId = workspaceIdParam || proy?.id;

      if (!wsId) {
        setError(isClientRoute ? 'No se encontró el cliente' : 'No se encontró workspace PROYECTOS');
        setLoading(false);
        return;
      }

      const b = await ensureBoardForFolder(wsId, folderId);
      setBoard(b);
      setFolder(b?.folder ?? null);
    } catch (e) {
      setError(e.message || 'Error al cargar');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [folderId, workspaceIdParam, isClientRoute, isBoardMode]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const breadcrumbItems = board?.workspace
    ? [
        { label: board.workspace.name, to: '/' },
        { label: board.name },
      ]
    : [];

  if (!isBoardMode) {
    return null;
  }

  if (loading && !board) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <span className="text-gray-400">Cargando directorio...</span>
      </div>
    );
  }

  if (error && !board) {
    return (
      <div className="p-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 flex flex-col gap-3 px-6 py-4 border-b border-dark-border bg-dark-card">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-white">
            {board?.name || folder?.name || 'Directorio'} — Directorio de Producción
          </h1>
          <nav className="flex gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`px-4 py-2 rounded-monday text-sm font-medium transition-colors ${
                  view === v.id
                    ? 'bg-accent text-white'
                    : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                }`}
              >
                {v.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {board && (view === 'ventas' || view === 'taller' || view === 'admin') && (
          <BoardTable board={board} onRefresh={loadBoard} directorio tableVariant={view} />
        )}
        {board && view === 'kanban' && <BoardKanban board={board} onRefresh={loadBoard} directorio />}
        {board && view === 'calendar' && <BoardTimeline board={board} onRefresh={loadBoard} directorio />}
      </div>
    </div>
  );
}
