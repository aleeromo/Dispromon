import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CellDate({ value, onUpdate }) {
  const dateStr = value?.date ?? null;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(
    dateStr ? format(parseISO(dateStr), 'yyyy-MM-dd') : ''
  );

  function handleSave() {
    if (val) onUpdate({ date: new Date(val).toISOString() });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="py-2 flex items-center gap-2">
        <input
          type="date"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="bg-dark-card border border-dark-border rounded px-2 py-1 text-sm text-white"
        />
        <button
          type="button"
          onClick={handleSave}
          className="px-2 py-1 rounded bg-accent text-white text-xs"
        >
          OK
        </button>
      </div>
    );
  }

  const label = dateStr
    ? format(parseISO(dateStr), "d MMM yyyy", { locale: es })
    : 'Seleccionar fecha';

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left px-3 py-2 rounded-monday text-sm text-gray-300 hover:bg-dark-hover min-h-[32px]"
    >
      {label}
    </button>
  );
}
