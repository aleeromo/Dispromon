import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CellTiempoProduccion({ item, onUpdate }) {
  const start = item.fecha_inicio_produccion
    ? (typeof item.fecha_inicio_produccion === 'string' ? item.fecha_inicio_produccion : item.fecha_inicio_produccion)
    : '';
  const end = item.fecha_fin_produccion
    ? (typeof item.fecha_fin_produccion === 'string' ? item.fecha_fin_produccion : item.fecha_fin_produccion)
    : '';
  const [editing, setEditing] = useState(false);
  const [startVal, setStartVal] = useState(start ? format(parseISO(start), 'yyyy-MM-dd') : '');
  const [endVal, setEndVal] = useState(end ? format(parseISO(end), 'yyyy-MM-dd') : '');

  function handleSave() {
    onUpdate({
      fecha_inicio_produccion: startVal ? new Date(startVal).toISOString() : null,
      fecha_fin_produccion: endVal ? new Date(endVal).toISOString() : null,
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="py-2 flex flex-col gap-2">
        <input
          type="date"
          value={startVal}
          onChange={(e) => setStartVal(e.target.value)}
          className="bg-dark-card border border-dark-border rounded px-2 py-1 text-sm text-white w-full"
        />
        <input
          type="date"
          value={endVal}
          onChange={(e) => setEndVal(e.target.value)}
          className="bg-dark-card border border-dark-border rounded px-2 py-1 text-sm text-white w-full"
        />
        <div className="flex gap-1">
          <button type="button" onClick={handleSave} className="px-2 py-1 rounded bg-accent text-white text-xs">
            OK
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-2 py-1 rounded bg-dark-border text-gray-300 text-xs">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const hasRange = start && end;
  const label = hasRange
    ? `${format(parseISO(start), 'd MMM', { locale: es })} - ${format(parseISO(end), 'd MMM', { locale: es })}`
    : 'Sin rango';

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full text-left px-2 py-2 rounded-monday text-sm text-gray-300 hover:bg-dark-hover min-h-[36px] flex items-center gap-2"
    >
      {hasRange ? (
        <span
          className="flex-1 h-6 rounded-monday flex items-center px-2 text-xs font-medium text-white truncate"
          style={{ backgroundColor: '#0073EA', minWidth: 60 }}
          title={label}
        >
          {label}
        </span>
      ) : (
        <span className="text-gray-500">{label}</span>
      )}
    </button>
  );
}
