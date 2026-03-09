import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CellTimeline({ value, onUpdate }) {
  const start = value?.start ? (typeof value.start === 'string' ? value.start : value.start) : '';
  const end = value?.end ? (typeof value.end === 'string' ? value.end : value.end) : '';
  const [editing, setEditing] = useState(false);
  const [startVal, setStartVal] = useState(start ? format(parseISO(start), 'yyyy-MM-dd') : '');
  const [endVal, setEndVal] = useState(end ? format(parseISO(end), 'yyyy-MM-dd') : '');

  function handleSave() {
    if (startVal && endVal) {
      onUpdate({
        start: new Date(startVal).toISOString(),
        end: new Date(endVal).toISOString(),
      });
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="py-2 flex flex-col gap-2">
        <input
          type="date"
          value={startVal}
          onChange={(e) => setStartVal(e.target.value)}
          className="bg-dark-card border border-dark-border rounded px-2 py-1 text-sm text-white"
        />
        <input
          type="date"
          value={endVal}
          onChange={(e) => setEndVal(e.target.value)}
          className="bg-dark-card border border-dark-border rounded px-2 py-1 text-sm text-white"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleSave}
            className="px-2 py-1 rounded bg-accent text-white text-xs"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-2 py-1 rounded bg-dark-border text-gray-300 text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const label =
    start && end
      ? `${format(parseISO(start), 'd MMM', { locale: es })} - ${format(parseISO(end), 'd MMM', { locale: es })}`
      : 'Sin fechas';

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
