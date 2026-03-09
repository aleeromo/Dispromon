import { useState, useRef, useEffect } from 'react';

const defaultOptions = [
  { id: 'done', label: 'Hecho', color: '#00c875' },
  { id: 'working', label: 'Trabajando', color: '#fdab3d' },
  { id: 'stuck', label: 'Estancado', color: '#e44258' },
];

export default function CellStatus({ value, itemId, columnId, onUpdate, options: opts }) {
  const options = opts && opts.length ? opts : defaultOptions;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const optionId = value?.optionId ?? null;
  const selected = options.find((o) => o.id === optionId);

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
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: selected.color + '30', color: selected.color }}
          >
            {selected.label}
          </span>
        ) : (
          <span className="text-gray-500">Sin estado</span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-dark-card border border-dark-border rounded-monday shadow-xl py-1 min-w-[140px]">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onUpdate({ optionId: opt.id });
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-dark-hover flex items-center gap-2 text-sm"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: opt.color }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
