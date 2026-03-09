import { useState, useRef, useEffect } from 'react';

export default function CellAsignadoA({ item, users, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = users?.find((u) => u.id === item.asignado_a_id) || item.asignado_a;

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3 py-1.5 rounded-monday text-sm border border-transparent hover:border-dark-border min-h-[32px] flex items-center"
      >
        {selected ? (
          <span className="text-white truncate">{selected.nombre}</span>
        ) : (
          <span className="text-gray-500">Sin asignar</span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-dark-card border border-dark-border rounded-monday shadow-xl py-1 min-w-[160px] max-h-[200px] overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onUpdate({ asignado_a_id: null });
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 hover:bg-dark-hover text-sm text-gray-400"
          >
            Sin asignar
          </button>
          {(users || []).map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                onUpdate({ asignado_a_id: u.id });
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-dark-hover text-sm ${item.asignado_a_id === u.id ? 'text-accent font-medium' : 'text-white'}`}
            >
              {u.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
