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
      <div className="h-full w-full flex items-center justify-center p-1 bg-white">
        <input
          type="date"
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            if (e.target.value) {
              onUpdate({ date: new Date(e.target.value).toISOString() });
              setEditing(false);
            }
          }}
          onBlur={() => setEditing(false)}
          autoFocus
          className="w-full h-full bg-white border-none outline-none text-[13px] text-monday-text cursor-pointer"
        />
      </div>
    );
  }

  const label = dateStr
    ? format(parseISO(dateStr), "d MMM", { locale: es })
    : '-';

  return (
    <div 
      className="h-full w-full flex items-center justify-center cursor-pointer group hover:bg-monday-hover transition-colors"
      onClick={() => setEditing(true)}
    >
      <span className={dateStr ? "text-[13px] text-monday-text" : "text-[13px] text-monday-text-muted opacity-0 group-hover:opacity-100 transition-opacity"}>
        {label}
      </span>
    </div>
  );
}
