import React, { useState } from 'react';

export default function CellRutaArchivo({ value, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  function handleSave() {
    setEditing(false);
    if (inputValue !== (value || '')) {
      onUpdate(inputValue);
    }
  }

  function handleCopy() {
    if (value) {
      navigator.clipboard.writeText(value);
      alert('Ruta copiada al portapapeles: ' + value);
    }
  }

  if (editing) {
    return (
      <div className="py-2 px-2 flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ej: Z:\Diseños"
          className="flex-1 min-w-0 bg-dark-bg border border-accent rounded px-2 py-1 text-sm text-white"
          autoFocus
        />
        <button onClick={handleSave} className="text-accent text-xs px-1">✓</button>
      </div>
    );
  }

  return (
    <div className="py-2 px-2 flex items-center justify-between group">
      {value ? (
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 rounded-monday bg-dark-hover text-accent hover:bg-accent/20 hover:text-white transition-colors text-sm font-medium"
          title={`Copiar ruta: ${value}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
            <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="truncate max-w-[100px]">{value}</span>
        </button>
      ) : (
        <span className="text-gray-500 text-sm pl-2">Sin ruta</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-accent p-1"
        title="Editar ruta"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}
