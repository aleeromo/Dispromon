import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Inbox from './Inbox';

export default function Layout() {
  const [inboxOpen, setInboxOpen] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false); // Prepare for Hito 4

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-monday-bg">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-auto bg-monday-bg">
           <Outlet context={{ setSidePanelOpen }} />
        </div>
        
        {/* Right Side Panel Matrix (Hito 4 placeholder) */}
        {sidePanelOpen && (
          <aside className="w-[450px] bg-white border-l border-monday-border shadow-xl flex flex-col z-20 relative transition-transform duration-300">
             {/* Render detail view here in later iter */}
             <div className="p-4 flex justify-between items-center border-b border-monday-border">
                <h3 className="font-semibold text-monday-text">Detalles</h3>
                <button onClick={() => setSidePanelOpen(false)} className="text-monday-text-muted hover:text-monday-text">
                  ✕
                </button>
             </div>
             <div className="p-4 overflow-auto flex-1">
               <p className="text-sm text-monday-text-muted">Selecciona "Updates" en la tabla para ver info.</p>
             </div>
          </aside>
        )}
      </main>
      <Inbox isOpen={inboxOpen} onClose={() => setInboxOpen(!inboxOpen)} />
    </div>
  );
}
