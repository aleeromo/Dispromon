import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getWorkspaces, getFolders, createFolder, createWorkspace, updateFolder, deleteFolder, updateWorkspace, deleteWorkspace } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

function FolderIcon({ className = 'w-4 h-4 text-monday-text-muted' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function FolderOpenIcon({ className = 'w-4 h-4 text-monday-text-muted' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
      <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function PlusIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function DotsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isAdmin } = useRole();
  const location = useLocation();
  const pathname = location.pathname || '';
  const [workspaces, setWorkspaces] = useState([]);
  const [folders, setFolders] = useState([]);
  const [clientFolders, setClientFolders] = useState({});
  const [loading, setLoading] = useState(true);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [addingSubfolderParentId, setAddingSubfolderParentId] = useState(null);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [addingFolderClientId, setAddingFolderClientId] = useState(null);
  const [newClientFolderName, setNewClientFolderName] = useState('');
  const [addingClientSubfolderParentId, setAddingClientSubfolderParentId] = useState(null);
  const [newClientSubfolderName, setNewClientSubfolderName] = useState('');
  const [addingClient, setAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [expandedFolderIds, setExpandedFolderIds] = useState(() => new Set());

  useEffect(() => {
    load();
  }, []);

  function buildFolderTree(flatList) {
    if (!flatList?.length) return [];
    const byParent = new Map();
    byParent.set(null, []);
    flatList.forEach((f) => {
      const pid = f.parentId ?? null;
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid).push(f);
    });
    function sortAndChildren(parentId) {
      const list = (byParent.get(parentId) || []).sort((a, b) => a.position - b.position);
      return list.map((f) => ({ ...f, children: sortAndChildren(f.id) }));
    }
    return sortAndChildren(null);
  }

  function toggleFolderExpanded(id) {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menuOpenId]);

  async function load() {
    setLoading(true);
    try {
      const ws = await getWorkspaces();
      setWorkspaces(ws);
      const proy = ws.find((w) => w.categoria_raiz === 'PROYECTOS' || w.name === 'PROYECTOS');
      if (proy?.id) {
        const list = await getFolders(proy.id).catch(() => []);
        setFolders(list);
      }
      const clientes = ws.filter((w) => w.categoria_raiz === 'CLIENTE_GRANDE');
      const next = {};
      await Promise.all(
        clientes.map(async (c) => {
          const list = await getFolders(c.id).catch(() => []);
          next[c.id] = list;
        })
      );
      setClientFolders(next);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFolder() {
    const proyId = workspaces.find((w) => w.categoria_raiz === 'PROYECTOS' || w.name === 'PROYECTOS')?.id;
    if (!proyId || !newFolderName.trim()) return;
    try {
      await createFolder(proyId, newFolderName.trim(), null);
      setNewFolderName('');
      setAddingFolder(false);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateSubfolder(parentId) {
    const proyId = workspaces.find((w) => w.categoria_raiz === 'PROYECTOS' || w.name === 'PROYECTOS')?.id;
    if (!proyId || !parentId || !newSubfolderName.trim()) return;
    try {
      await createFolder(proyId, newSubfolderName.trim(), parentId);
      setNewSubfolderName('');
      setAddingSubfolderParentId(null);
      setExpandedFolderIds(prev => new Set([...prev, parentId])); // Auto-expand
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateClientFolder(wsId) {
    if (!wsId || !newClientFolderName.trim()) return;
    try {
      await createFolder(wsId, newClientFolderName.trim(), null);
      setNewClientFolderName('');
      setAddingFolderClientId(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateClientSubfolder(wsId, parentFolderId) {
    if (!wsId || !parentFolderId || !newClientSubfolderName.trim()) return;
    try {
      await createFolder(wsId, newClientSubfolderName.trim(), parentFolderId);
      setNewClientSubfolderName('');
      setAddingClientSubfolderParentId(null);
      setExpandedFolderIds(prev => new Set([...prev, 'cf-' + parentFolderId])); // Auto-expand
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateClient() {
    if (!newClientName.trim()) return;
    try {
      await createWorkspace(newClientName.trim(), 'CLIENTE_GRANDE');
      setNewClientName('');
      setAddingClient(false);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  function openFolderEdit(folder) {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
    setMenuOpenId(null);
  }

  async function saveFolderEdit() {
    if (!editingFolderId || !editingFolderName.trim()) return;
    try {
      await updateFolder(editingFolderId, { name: editingFolderName.trim() });
      setEditingFolderId(null);
      setEditingFolderName('');
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteFolder(id) {
    if (!window.confirm('¿Eliminar esta carpeta y todo su contenido?')) return;
    try {
      await deleteFolder(id);
      setMenuOpenId(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  function openWorkspaceEdit(ws) {
    setEditingWorkspaceId(ws.id);
    setEditingWorkspaceName(ws.name);
    setMenuOpenId(null);
  }

  async function saveWorkspaceEdit() {
    if (!editingWorkspaceId || !editingWorkspaceName.trim()) return;
    try {
      await updateWorkspace(editingWorkspaceId, { name: editingWorkspaceName.trim() });
      setEditingWorkspaceId(null);
      setEditingWorkspaceName('');
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteWorkspace(id) {
    if (!window.confirm('¿Eliminar este cliente y todas sus carpetas y proyectos?')) return;
    try {
      await deleteWorkspace(id);
      setMenuOpenId(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  const proyectosWs = workspaces.filter((w) => w.categoria_raiz === 'PROYECTOS' || w.name === 'PROYECTOS');
  const clientesWs = workspaces.filter((w) => w.categoria_raiz === 'CLIENTE_GRANDE');
  const proyectosId = proyectosWs[0]?.id;
  const folderTreeProyectos = buildFolderTree(folders);
  const folderTreeByClient = {};
  clientesWs.forEach((ws) => {
    folderTreeByClient[ws.id] = buildFolderTree(clientFolders[ws.id] || []);
  });

  function renderFolderTreeItem(folder, basePath, pathPrefix, level = 0) {
    const hasChildren = folder.children?.length > 0;
    const isExpanded = expandedFolderIds.has(folder.id);
    const isActive = pathname === pathPrefix || pathname.startsWith(pathPrefix + '/');
    const plRem = 0.5 + level * 1.5; // Starts at 0.5rem, adds 1.5rem per level
    
    return (
      <li key={folder.id} className="group relative">
        {editingFolderId === folder.id ? (
          <div className="flex items-center gap-1 py-1 px-2 mb-1" style={{ paddingLeft: `${plRem}rem` }}>
            <input
              type="text"
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveFolderEdit()}
              className="flex-1 min-w-0 bg-white border border-monday-border rounded px-2 py-1 text-sm text-monday-text"
              autoFocus
            />
            <button type="button" onClick={saveFolderEdit} className="px-2 py-1 rounded text-accent text-xs">Guardar</button>
            <button type="button" onClick={() => { setEditingFolderId(null); setEditingFolderName(''); }} className="px-2 py-1 rounded text-monday-text-muted text-xs">Cancelar</button>
          </div>
        ) : (
          <>
            <div 
              className={`relative flex items-center gap-1 mb-1 border-l-2 ${level > 0 ? 'border-monday-border' : 'border-transparent'}`} 
              style={{ paddingLeft: `${plRem}rem`, marginLeft: level > 0 ? `${(level - 1) * 1.5 + 0.75}rem` : '0', width: level > 0 ? `calc(100% - ${(level - 1) * 1.5 + 0.75}rem)` : '100%' }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleFolderExpanded(folder.id)}
                  className="p-0.5 rounded text-monday-text-muted hover:bg-monday-hover hover:text-monday-text shrink-0"
                  aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              ) : (
                <span className="w-3.5 inline-block shrink-0" />
              )}
              <Link
                to={basePath + '/' + folder.id + '/board'}
                className={`flex-1 flex items-center gap-2 py-2 px-2 rounded-monday text-sm truncate pr-12 ${
                  isActive ? 'bg-monday-primary/10 text-monday-primary font-medium' : 'text-monday-text hover:bg-monday-hover'
                }`}
              >
                <FolderIcon className="w-3.5 h-3.5 text-monday-text-muted shrink-0" />
                {folder.name}
              </Link>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddingSubfolderParentId(folder.id); setNewSubfolderName(''); setMenuOpenId(null); }}
                  className="p-1 rounded text-monday-text-muted hover:bg-monday-hover hover:text-monday-primary"
                  title="Nueva subcarpeta"
                  aria-label="Nueva subcarpeta"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(menuOpenId === 'folder-' + folder.id ? null : 'folder-' + folder.id); }}
                  className="p-1 rounded text-monday-text-muted hover:bg-monday-hover hover:text-monday-text"
                  aria-label="Opciones"
                >
                  <DotsIcon className="w-4 h-4" />
                </button>
                {menuOpenId === 'folder-' + folder.id && (
                  <div className="absolute right-0 top-full mt-1 z-30 py-1 min-w-[120px] bg-white border border-monday-border rounded-monday shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => openFolderEdit(folder)} className="w-full text-left px-3 py-2 text-sm text-monday-text hover:bg-monday-hover">Editar</button>
                    <button type="button" onClick={() => handleDeleteFolder(folder.id)} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-monday-hover">Eliminar</button>
                  </div>
                )}
              </div>
            </div>
            {addingSubfolderParentId === folder.id && (
              <div className="flex gap-1 py-2 mb-1 border-l-2 border-monday-border" style={{ paddingLeft: `1rem`, marginLeft: `${level * 1.5 + 0.75}rem` }}>
                <input
                  type="text"
                  value={newSubfolderName}
                  onChange={(e) => setNewSubfolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSubfolder(folder.id)}
                  placeholder="Nombre subcarpeta"
                  className="flex-1 min-w-0 bg-white border border-monday-border rounded-monday px-2 py-1 text-sm text-monday-text placeholder-monday-text-muted"
                  autoFocus
                />
                <button type="button" onClick={() => handleCreateSubfolder(folder.id)} disabled={!newSubfolderName.trim()} className="px-2 py-1 rounded-monday bg-monday-primary text-white text-sm disabled:opacity-50">Añadir</button>
                <button type="button" onClick={() => { setAddingSubfolderParentId(null); setNewSubfolderName(''); }} className="px-2 py-1 rounded-monday text-monday-text-muted hover:text-monday-text text-sm">Cancelar</button>
              </div>
            )}
            {hasChildren && isExpanded && (
              <ul className="space-y-0.5">
                {folder.children.map((child) => renderFolderTreeItem(child, basePath, pathPrefix + '/' + child.id, level + 1))}
              </ul>
            )}
          </>
        )}
      </li>
    );
  }

  function renderClientFolderTreeItem(folder, wsId, pathPrefix, level = 0) {
    const hasChildren = folder.children?.length > 0;
    const isExpanded = expandedFolderIds.has('cf-' + folder.id);
    const isActive = pathname === pathPrefix || pathname.startsWith(pathPrefix + '/');
    const plRem = 0.5 + level * 1.5;
    
    return (
      <li key={folder.id} className="group relative">
        {editingFolderId === folder.id ? (
          <div className="flex items-center gap-1 py-1 px-2 mb-1" style={{ paddingLeft: `${plRem}rem` }}>
            <input type="text" value={editingFolderName} onChange={(e) => setEditingFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveFolderEdit()} className="flex-1 min-w-0 bg-dark-bg border border-dark-border rounded px-2 py-1 text-sm text-white" autoFocus />
            <button type="button" onClick={saveFolderEdit} className="px-2 py-1 rounded text-accent text-xs">Guardar</button>
            <button type="button" onClick={() => { setEditingFolderId(null); setEditingFolderName(''); }} className="px-2 py-1 rounded text-monday-text-muted text-xs">Cancelar</button>
          </div>
        ) : (
          <>
            <div 
              className={`relative flex items-center gap-1 mb-1 border-l-2 ${level > 0 ? 'border-monday-border' : 'border-transparent'}`} 
              style={{ paddingLeft: `${plRem}rem`, marginLeft: level > 0 ? `${(level - 1) * 1.5 + 0.75}rem` : '0', width: level > 0 ? `calc(100% - ${(level - 1) * 1.5 + 0.75}rem)` : '100%' }}
            >
              {hasChildren ? (
                <button type="button" onClick={() => toggleFolderExpanded('cf-' + folder.id)} className="p-0.5 rounded text-gray-500 hover:text-white shrink-0" aria-label={isExpanded ? 'Contraer' : 'Expandir'}>
                  <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
              ) : (
                <span className="w-3.5 inline-block shrink-0" />
              )}
              <Link to={`/cliente/${wsId}/${folder.id}/board`} className={`flex-1 flex items-center gap-2 py-2 px-2 rounded-monday text-sm truncate pr-12 ${isActive ? 'bg-accent/20 text-accent font-medium' : 'text-gray-300 hover:bg-dark-hover hover:text-white'}`}>
                <FolderIcon className="w-3.5 h-3.5 text-monday-text-muted shrink-0" />
                {folder.name}
              </Link>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddingClientSubfolderParentId(folder.id); setNewClientSubfolderName(''); setMenuOpenId(null); }} className="p-1 rounded text-gray-500 hover:bg-dark-hover hover:text-accent" title="Nueva subcarpeta" aria-label="Nueva subcarpeta"><PlusIcon className="w-4 h-4" /></button>
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(menuOpenId === 'cf-' + folder.id ? null : 'cf-' + folder.id); }} className="p-1 rounded text-gray-500 hover:bg-dark-hover hover:text-white" aria-label="Opciones"><DotsIcon className="w-4 h-4" /></button>
                {menuOpenId === 'cf-' + folder.id && (
                  <div className="absolute right-0 top-full mt-1 z-30 py-1 min-w-[120px] bg-white border border-monday-border rounded-monday shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => openFolderEdit(folder)} className="w-full text-left px-3 py-2 text-sm text-monday-text hover:bg-monday-hover">Editar</button>
                    <button type="button" onClick={() => handleDeleteFolder(folder.id)} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-monday-hover">Eliminar</button>
                  </div>
                )}
              </div>
            </div>
            {addingClientSubfolderParentId === folder.id && (
              <div className="flex gap-1 py-2 mb-1 border-l-2 border-dark-border/50" style={{ paddingLeft: `1rem`, marginLeft: `${level * 1.5 + 0.75}rem` }}>
                <input type="text" value={newClientSubfolderName} onChange={(e) => setNewClientSubfolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateClientSubfolder(wsId, folder.id)} placeholder="Nombre subcarpeta" className="flex-1 min-w-0 bg-dark-bg border border-dark-border rounded-monday px-2 py-1 text-sm text-white placeholder-gray-500" autoFocus />
                <button type="button" onClick={() => handleCreateClientSubfolder(wsId, folder.id)} disabled={!newClientSubfolderName.trim()} className="px-2 py-1 rounded-monday bg-accent text-white text-sm disabled:opacity-50">Añadir</button>
                <button type="button" onClick={() => { setAddingClientSubfolderParentId(null); setNewClientSubfolderName(''); }} className="px-2 py-1 rounded-monday text-gray-400 hover:text-white text-sm">Cancelar</button>
              </div>
            )}
            {hasChildren && isExpanded && (
              <ul className="space-y-0.5">
                {folder.children.map((child) => renderClientFolderTreeItem(child, wsId, `/cliente/${wsId}/${child.id}`, level + 1))}
              </ul>
            )}
          </>
        )}
      </li>
    );
  }

  const navContent = loading ? (
    <div className="text-monday-text-muted text-sm py-4">Cargando...</div>
  ) : (
    <>
      {proyectosId && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <FolderIcon className="w-4 h-4 text-amber-500/90 shrink-0" />
            <span className="text-monday-text font-medium text-sm">PROYECTOS</span>
            <button
              type="button"
              onClick={() => setAddingFolder(true)}
              className="ml-auto p-1 rounded text-gray-500 hover:bg-dark-hover hover:text-accent"
              title="Nueva carpeta"
              aria-label="Nueva carpeta"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          {addingFolder && (
            <div className="pl-6 pr-2 py-2 flex gap-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Nombre carpeta"
                className="flex-1 min-w-0 bg-white border border-monday-border rounded-monday px-2 py-1 text-sm text-monday-text placeholder-monday-text-muted"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-2 py-1 rounded-monday bg-monday-primary text-white text-sm disabled:opacity-50"
              >
                Añadir
              </button>
              <button
                type="button"
                onClick={() => { setAddingFolder(false); setNewFolderName(''); }}
                className="px-2 py-1 rounded-monday text-monday-text-muted hover:text-monday-text text-sm"
              >
                Cancelar
              </button>
            </div>
          )}
          <ul className="space-y-0.5 pl-2">
            {folderTreeProyectos.map((folder) => renderFolderTreeItem(folder, '/proyectos', '/proyectos/' + folder.id, 0))}
          </ul>
        </div>
      )}
      <div className="pt-2 border-t border-monday-border">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-monday-text-muted text-xs font-medium uppercase tracking-wider px-1">CLIENTES</p>
          <button
            type="button"
            onClick={() => setAddingClient(true)}
            className="p-1 rounded text-gray-500 hover:bg-dark-hover hover:text-accent"
            title="Añadir cliente"
            aria-label="Añadir cliente"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        {addingClient && (
          <div className="pl-1 pr-2 py-2 flex gap-1 mb-2">
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateClient()}
              placeholder="Nombre del cliente"
              className="flex-1 min-w-0 bg-white border border-monday-border rounded-monday px-2 py-1 text-sm text-monday-text placeholder-monday-text-muted"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={!newClientName.trim()}
              className="px-2 py-1 rounded-monday bg-monday-primary text-white text-sm disabled:opacity-50"
            >
              Añadir
            </button>
            <button
              type="button"
              onClick={() => { setAddingClient(false); setNewClientName(''); }}
              className="px-2 py-1 rounded-monday text-monday-text-muted hover:text-monday-text text-sm"
            >
              Cancelar
            </button>
          </div>
        )}
        {clientesWs.length > 0 && clientesWs.map((ws) => (
            <div key={ws.id} className="mb-4 group-client">
              <div className="flex items-center gap-2 mb-1">
                {editingWorkspaceId === ws.id ? (
                  <div className="flex-1 flex items-center gap-1 pl-0">
                    <input
                      type="text"
                      value={editingWorkspaceName}
                      onChange={(e) => setEditingWorkspaceName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveWorkspaceEdit()}
                      className="flex-1 min-w-0 bg-white border border-monday-border rounded px-2 py-1 text-sm text-monday-text"
                      autoFocus
                    />
                    <button type="button" onClick={saveWorkspaceEdit} className="px-2 py-1 rounded text-accent text-xs shrink-0">Guardar</button>
                    <button type="button" onClick={() => { setEditingWorkspaceId(null); setEditingWorkspaceName(''); }} className="px-2 py-1 rounded text-monday-text-muted text-xs shrink-0">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <FolderOpenIcon className="w-4 h-4 text-accent/80 shrink-0" />
                    <span className="text-monday-text font-medium text-sm truncate flex-1 min-w-0">{ws.name}</span>
                    <button
                      type="button"
                      onClick={() => setAddingFolderClientId(ws.id)}
                      className="p-1 rounded text-monday-text-muted hover:bg-monday-hover hover:text-monday-primary"
                      title="Nueva carpeta (ej. año)"
                      aria-label="Nueva carpeta"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === 'ws-' + ws.id ? null : 'ws-' + ws.id); }}
                        className="p-1 rounded text-monday-text-muted hover:bg-monday-hover hover:text-monday-text"
                        aria-label="Opciones cliente"
                      >
                        <DotsIcon className="w-4 h-4" />
                      </button>
                      {menuOpenId === 'ws-' + ws.id && (
                        <div className="absolute right-0 top-full mt-1 z-30 py-1 min-w-[120px] bg-dark-card border border-dark-border rounded-monday shadow-xl" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => openWorkspaceEdit(ws)} className="w-full text-left px-3 py-2 text-sm text-white hover:bg-dark-hover">Editar</button>
                          <button type="button" onClick={() => handleDeleteWorkspace(ws.id)} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-dark-hover">Eliminar</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              {addingFolderClientId === ws.id && (
                <div className="pl-6 pr-2 py-2 flex gap-1">
                  <input
                    type="text"
                    value={newClientFolderName}
                    onChange={(e) => setNewClientFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateClientFolder(ws.id)}
                    placeholder="Ej. 2026"
                    className="flex-1 min-w-0 bg-white border border-monday-border rounded-monday px-2 py-1 text-sm text-monday-text placeholder-monday-text-muted"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleCreateClientFolder(ws.id)}
                    disabled={!newClientFolderName.trim()}
                    className="px-2 py-1 rounded-monday bg-monday-primary text-white text-sm disabled:opacity-50"
                  >
                    Añadir
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingFolderClientId(null); setNewClientFolderName(''); }}
                    className="px-2 py-1 rounded-monday text-monday-text-muted hover:text-monday-text text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
              <ul className="space-y-0.5 pl-2">
                {(folderTreeByClient[ws.id] || []).map((folder) => renderClientFolderTreeItem(folder, ws.id, `/cliente/${ws.id}/${folder.id}`, 0))}
              </ul>
            </div>
          ))}
        {clientesWs.length === 0 && !addingClient && (
          <p className="text-monday-text-muted text-sm pl-1">Añade un cliente con +</p>
        )}
      </div>
      {!proyectosId && clientesWs.length === 0 && !addingClient && (
        <p className="text-monday-text-muted text-sm">No hay workspace PROYECTOS. Ejecuta el seed.</p>
      )}
    </>
  );

  return (
    <aside className="w-sidebar min-w-[260px] bg-white border-r border-monday-border flex flex-col shrink-0">
      <div className="p-4 border-b border-monday-border flex items-center justify-center min-h-[160px]">
        <img
          src="/logo.png"
          alt=""
          className="h-36 w-auto max-h-36 object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {isAdmin && (
          <Link
            to="/gestion-usuarios"
            className="mb-3 flex items-center gap-2 py-2 px-3 rounded-monday text-sm text-monday-text hover:bg-monday-hover"
          >
            Gestión de Usuarios
          </Link>
        )}
        {navContent}
      </nav>
      <div className="p-3 border-t border-monday-border">
        {user && (
          <div className="text-monday-text-muted text-xs truncate mb-2" title={user.nombre}>
            {user.nombre} · {user.rol}
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="w-full py-2 px-3 rounded-monday text-sm text-monday-text-muted hover:bg-monday-hover hover:text-monday-text border border-monday-border"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
