import { useState, useRef } from 'react';
import { uploadFile } from '../../../api/client';

// En desarrollo Vite hace proxy de /uploads al backend
const API_BASE = '';

export default function CellFile({ value, onUpdate }) {
  const files = value?.files ?? [];
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      onUpdate({ files: [...files, { url: API_BASE + url, name: file.name }] });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(i) {
    const next = files.filter((_, idx) => idx !== i);
    onUpdate({ files: next });
  }

  return (
    <div className="py-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />
      <div className="flex flex-wrap gap-1">
        {files.map((f, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-dark-card text-gray-300 text-xs max-w-full"
          >
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-accent hover:underline"
            >
              {f.name}
            </a>
            <button type="button" onClick={() => remove(i)} className="text-gray-500 hover:text-white">
              ×
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-2 py-1 rounded border border-dashed border-dark-border text-gray-500 text-xs hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : '+ Archivo'}
        </button>
      </div>
    </div>
  );
}
