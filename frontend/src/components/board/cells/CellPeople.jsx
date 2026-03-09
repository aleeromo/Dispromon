import { useState } from 'react';

export default function CellPeople({ value, onUpdate }) {
  const names = value?.names ?? [];
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  function add() {
    const name = input.trim();
    if (!name) return;
    onUpdate({ names: [...names, name] });
    setInput('');
  }

  function remove(i) {
    const next = names.filter((_, idx) => idx !== i);
    onUpdate({ names: next });
  }

  if (editing) {
    return (
      <div className="py-2 space-y-2">
        <div className="flex flex-wrap gap-1">
          {names.map((n, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/20 text-accent text-xs"
            >
              {n}
              <button type="button" onClick={() => remove(i)} className="hover:text-white">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Nombre"
            className="flex-1 bg-dark-card border border-dark-border rounded px-2 py-1 text-sm text-white"
          />
          <button
            type="button"
            onClick={add}
            className="px-2 py-1 rounded bg-accent text-white text-xs"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-gray-400 text-xs"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left px-3 py-2 rounded-monday text-sm text-gray-300 hover:bg-dark-hover min-h-[32px]"
    >
      {names.length > 0 ? names.join(', ') : 'Añadir personas'}
    </button>
  );
}
