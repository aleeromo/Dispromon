import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFolder, getFolders, deleteFolder } from '../api/client';
import Breadcrumbs from '../components/Breadcrumbs';

function FolderIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default function FolderViewPage({ workspaceId, workspaceName, basePath, baseLabel, initialFolder, initialChildren }) {
  const { folderId } = useParams();
  const [folder, setFolder] = useState(initialFolder ?? null);
  const [children, setChildren] = useState(initialChildren ?? []);
  const [loading, setLoading] = useState(!initialFolder);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    if (!folderId || !workspaceId) return;
    setLoading(true);
    setError('');
    try {
      const [f, list] = await Promise.all([
        getFolder(folderId),
        getFolders(workspaceId, folderId),
      ]);
      setFolder(f);
      setChildren(list);
    } catch (e) {
      setError(e.message || 'Error al cargar');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [folderId, workspaceId]);

  useEffect(() => {
    if (initialFolder != null) {
      setFolder(initialFolder);
      setChildren(initialChildren ?? []);
      setLoading(false);
    } else if (folderId && workspaceId) {
      load();
    }
  }, [folderId, workspaceId, initialFolder, initialChildren]);

  async function handleDeleteSubfolder(childId) {
    if (!window.confirm('¿Eliminar esta subcarpeta y todo su contenido?')) return;
    setDeletingId(childId);
    try {
      await deleteFolder(childId);
      setChildren((prev) => prev.filter((c) => c.id !== childId));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  }

  const breadcrumbItems = [
    { label: workspaceName, to: '/' },
    ...(folder?.parent ? [{ label: folder.parent.name, to: `${basePath}/${folder.parent.id}` }] : []),
    { label: folder?.name || 'Carpeta' },
  ];

  if (loading && !folder) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <span className="text-gray-400">Cargando...</span>
      </div>
    );
  }
  if (error && !folder) {
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
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <FolderIcon className="w-6 h-6 shrink-0 text-amber-500/90" />
          {folder?.name}
        </h1>
      </header>
      <div className="flex-1 overflow-auto p-6">
        {children.length === 0 ? (
          <div className="text-gray-500 py-6">
            <p className="mb-2">No hay subcarpetas. Crea una desde el símbolo + junto a esta carpeta en el menú lateral.</p>
            <p className="text-sm mb-4">Puedes crear año → mes → cliente y luego abrir la carpeta como Directorio de Producción.</p>
            <Link
              to={`${basePath}/${folderId}/board`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-monday bg-accent text-white text-sm font-medium hover:bg-accentHover"
            >
              Abrir Directorio de Producción →
            </Link>
          </div>
        ) : (
          <ul className="space-y-1">
            {children.map((child) => (
              <li key={child.id} className="group/list flex items-center gap-1">
                <Link
                  to={`${basePath}/${child.id}`}
                  className="flex-1 flex items-center gap-3 py-3 px-4 rounded-monday bg-dark-card border border-dark-border hover:border-accent/50 hover:bg-dark-hover transition-colors"
                >
                  <FolderIcon className="w-5 h-5 text-amber-500/90 shrink-0" />
                  <span className="font-medium text-white">{child.name}</span>
                  {child._count?.children > 0 && (
                    <span className="text-gray-500 text-sm">{child._count.children} subcarpetas</span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleDeleteSubfolder(child.id); }}
                  disabled={deletingId === child.id}
                  className="p-2 rounded-monday text-gray-500 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover/list:opacity-100 transition-opacity disabled:opacity-50"
                  title="Eliminar subcarpeta"
                  aria-label="Eliminar subcarpeta"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
