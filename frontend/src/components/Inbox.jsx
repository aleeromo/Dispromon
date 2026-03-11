import { useState, useEffect } from 'react';
import { getTasks, markTaskRead } from '../api/client';
import { Link } from 'react-router-dom';

function BellIcon({ className = "w-5 h-5", hasUnread = false }) {
  return (
    <div className="relative">
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {hasUnread && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-dark-bg"></span>
      )}
    </div>
  );
}

export default function Inbox({ isOpen, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const POLL_INTERVAL = 30000; // 30 segundos

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  async function fetchTasks() {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (e) {
      console.error('Error fetching tasks', e);
    }
  }

  async function handleMarkRead(id) {
    try {
      await markTaskRead(id);
      setTasks(tasks.map(t => t.id === id ? { ...t, isRead: true } : t));
    } catch (e) {
      console.error(e);
    }
  }

  const unreadCount = tasks.filter(t => !t.isRead).length;

  return (
    <>
      {/* Botón Flotante o en Navbar para abrir el Inbox */}
      <button 
        onClick={onClose} 
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-dark-card border border-dark-border text-gray-400 hover:text-white shadow-lg transition-transform hover:scale-105"
        title="Bandeja de Entrada"
      >
        <BellIcon hasUnread={unreadCount > 0} />
      </button>

      {/* Slide-over Background Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Slide-over Panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-dark-bg border-l border-dark-border shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-dark-border bg-dark-card">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Bandeja de Entrada
            {unreadCount > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs py-0.5 px-2 rounded-full font-medium">
                {unreadCount} nuevas
              </span>
            )}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-dark-hover transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && tasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Cargando tareas...</p>
          ) : tasks.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto w-12 h-12 rounded-full bg-dark-hover flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No tienes tareas pendientes.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`p-3 rounded-lg border transition-colors ${task.isRead ? 'bg-dark-bg border-dark-border opacity-70' : 'bg-dark-card border-accent/30 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-medium text-sm ${task.isRead ? 'text-gray-300' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  {!task.isRead && (
                    <span className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0"></span>
                  )}
                </div>
                {task.description && (
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  
                  <div className="flex gap-2">
                    {!task.isRead && (
                      <button 
                        onClick={() => handleMarkRead(task.id)}
                        className="text-xs text-accent hover:text-white px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 transition-colors font-medium"
                      >
                        Marcar leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
