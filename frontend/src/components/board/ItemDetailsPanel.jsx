import React, { useState, useEffect } from 'react';
import { getUpdates, postUpdate, deleteUpdate } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ItemDetailsPanel({ item, board, onClose, onRefresh }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('updates'); // 'updates', 'info', 'activity'
  const [updates, setUpdates] = useState([]);
  const [newUpdateContent, setNewUpdateContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item?.id) {
      loadUpdates();
    }
  }, [item?.id]);

  async function loadUpdates() {
    setLoading(true);
    try {
      const data = await getUpdates(item.id);
      setUpdates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePostUpdate(e) {
    if (e) e.preventDefault();
    if (!newUpdateContent.trim()) return;
    try {
      await postUpdate(item.id, newUpdateContent);
      setNewUpdateContent('');
      loadUpdates();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(updateId) {
    if (!window.confirm('¿Borrar esta actualización?')) return;
    try {
      await deleteUpdate(updateId);
      loadUpdates();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  if (!item) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col border-l border-monday-border animate-slideInRight">
      {/* Header */}
      <div className="px-6 py-4 border-b border-monday-border flex items-start justify-between">
        <div className="flex-1 overflow-hidden pr-4">
          <h2 className="text-2xl font-semibold text-monday-text tracking-tight truncate">
            {item.name || 'Sin título'}
          </h2>
          <p className="text-monday-text-muted text-sm mt-1 truncate">
            {board?.name}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-monday-border px-6 mt-2">
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2.5 text-sm font-medium mr-2 border-b-2 transition-colors ${
            activeTab === 'updates' ? 'border-monday-primary text-monday-primary' : 'border-transparent text-monday-text-muted hover:text-monday-text'
          }`}
        >
          Actualizaciones
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2.5 text-sm font-medium mr-2 border-b-2 transition-colors ${
            activeTab === 'info' ? 'border-monday-primary text-monday-primary' : 'border-transparent text-monday-text-muted hover:text-monday-text'
          }`}
        >
          Info
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'activity' ? 'border-monday-primary text-monday-primary' : 'border-transparent text-monday-text-muted hover:text-monday-text'
          }`}
        >
          Registro de Actividad
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-monday-bg relative">
        {activeTab === 'updates' && (
          <div className="p-6">
            {/* Editor Input */}
            <form onSubmit={handlePostUpdate} className="bg-white border text-left border-monday-border rounded-lg shadow-sm mb-6 focus-within:ring-2 ring-monday-primary/20 transition-all flex flex-col">
              <textarea
                value={newUpdateContent}
                onChange={e => setNewUpdateContent(e.target.value)}
                placeholder="Escribe una actualización..."
                className="w-full resize-none min-h-[100px] border-none outline-none p-4 text-monday-text text-sm rounded-t-lg"
              />
              <div className="bg-gray-50 border-t border-monday-border px-4 py-2.5 rounded-b-lg flex justify-end">
                <button
                  type="submit"
                  disabled={!newUpdateContent.trim()}
                  className="bg-monday-primary text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 hover:bg-monday-primary/90 transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </form>

            <div className="space-y-6">
              {loading && <p className="text-center text-monday-text-muted text-sm py-4">Cargando...</p>}
              {!loading && updates.length === 0 && (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <h3 className="text-monday-text font-medium text-lg">Aún no hay actualizaciones para este elemento</h3>
                  <p className="text-monday-text-muted text-sm mt-1 max-w-xs mx-auto">Comunícate con tu equipo iniciando una conversación</p>
                </div>
              )}
              {updates.map(u => (
                <div key={u.id} className="bg-white border border-monday-border rounded-lg shadow-sm p-5 relative group text-left">
                  {user && (user.id === u.userId || user.rol === 'ADMIN') && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                      {u.user?.nombre?.substring(0, 1).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-monday-text font-medium text-sm leading-tight">{u.user?.nombre || 'Usuario Desconocido'}</p>
                      <p className="text-monday-text-muted text-xs flex items-center gap-1 mt-0.5" title={new Date(u.createdAt).toLocaleString()}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatDistanceToNow(parseISO(u.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="text-monday-text text-[15px] whitespace-pre-wrap pl-13">
                    {u.content}
                  </div>
                  
                  {/* Footer actions dummy */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 pl-13">
                     <button className="text-gray-500 hover:text-monday-primary text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                        Me gusta
                     </button>
                     <button className="text-gray-500 hover:text-monday-primary text-xs font-medium flex items-center gap-1.5 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        Responder
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'info' && (
          <div className="p-6">
            <h3 className="text-sm font-medium text-monday-text-muted uppercase tracking-wider mb-4 border-b pb-2">Datos del Elemento</h3>
            <div className="space-y-4">
              {item.values?.map((val) => {
                 const col = board?.columns?.find(c => c.id === val.columnId);
                 if (!col) return null;
                 let displayVal = val.value;
                 try {
                   if (displayVal.startsWith('{') || displayVal.startsWith('[')) {
                     const parsed = JSON.parse(displayVal);
                     if (col.type === 'status') {
                        const opts = col.settings ? JSON.parse(col.settings).options : [];
                        const match = opts?.find(o => o.id === parsed.optionId);
                        displayVal = match ? match.label : 'Sin estado';
                     } else if (col.type === 'timeline') {
                        displayVal = `${parsed.start?.substring(0,10) || '-'} al ${parsed.end?.substring(0,10) || '-'}`;
                     } else {
                        displayVal = displayVal; // keep dirty 
                     }
                   }
                 } catch(e) {}

                 return (
                   <div key={val.id}>
                     <p className="text-xs text-monday-text-muted mb-1">{col.title}</p>
                     <p className="text-sm text-monday-text font-medium bg-gray-50 p-2 rounded border border-gray-100">{displayVal || '-'}</p>
                   </div>
                 );
              })}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="p-6 flex flex-col items-center justify-center text-center py-20 opacity-60">
             <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <p className="text-monday-text-muted text-sm">Registro de actividad en construcción...</p>
          </div>
        )}
      </div>
    </div>
  );
}
