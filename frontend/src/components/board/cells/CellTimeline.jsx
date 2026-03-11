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
      <div className="h-full w-full flex flex-col items-center justify-center p-1 bg-white border border-monday-primary shadow-sm rounded-monday absolute z-10 w-max left-[10%] pr-3">
        <div className="flex items-center gap-2 mb-1">
          <input
            type="date"
            value={startVal}
            onChange={(e) => setStartVal(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[12px] text-monday-text cursor-pointer"
          />
          <span className="text-monday-text-muted">-</span>
          <input
            type="date"
            value={endVal}
            onChange={(e) => setEndVal(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[12px] text-monday-text cursor-pointer"
          />
        </div>
        <div className="flex gap-1 self-end">
          <button
            type="button"
            onClick={handleSave}
            className="px-2 py-0.5 rounded bg-monday-primary text-white text-[11px] hover:opacity-90"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-2 py-0.5 rounded bg-gray-100 text-monday-text text-[11px] hover:bg-gray-200"
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
      : '-';

  return (
    <div 
      className="h-full w-full flex items-center justify-center cursor-pointer relative group hover:bg-monday-hover transition-colors"
      onClick={() => setEditing(true)}
    >
      <div className={`absolute inset-y-1 mx-2 left-0 right-0 rounded-full flex items-center justify-center ${start && end ? 'bg-[#333333]' : ''}`}>
        <span className={start && end ? "text-[12px] text-white px-2 truncate" : "text-[13px] text-monday-text-muted opacity-0 group-hover:opacity-100 transition-opacity"}>
          {label}
        </span>
      </div>
    </div>
  );
}
