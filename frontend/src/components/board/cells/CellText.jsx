import { useState } from 'react';

export default function CellText({ value, onUpdate }) {
  const text = value?.text ?? (typeof value === 'string' ? value : '');
  const [local, setLocal] = useState(text);
  const [focused, setFocused] = useState(false);

  function handleBlur() {
    setFocused(false);
    if (String(local).trim() !== String(text).trim()) {
      onUpdate({ text: local });
    }
  }

  return (
    <div className="py-2">
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder="Texto"
        className="w-full bg-transparent border-none outline-none py-1 px-2 rounded text-sm text-white placeholder-gray-500 focus:ring-1 ring-accent"
      />
    </div>
  );
}
