import { useState, useRef } from 'react';
import { uploadFile } from '../../../api/client';

const API_BASE = '';
const ACCEPT = '.pdf,.jpg,.jpeg,.jpe';
const ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'jpe'];

function getExt(name) {
  const i = (name || '').lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export default function CellCotizacion({ value, onUpdate }) {
  const files = value?.files ?? [];
  const file = files[0] || null;
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = getExt(f.name);
    if (!ALLOWED_EXT.includes(ext)) {
      alert('Solo se permiten archivos PDF o JPG.');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadFile(f);
      onUpdate({ files: [{ url: API_BASE + url, name: f.name }] });
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove() {
    onUpdate({ files: [] });
  }

  return (
    <div className="py-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT}
        onChange={handleFile}
        disabled={uploading}
      />
      {file ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-monday bg-dark-card border border-dark-border text-gray-300 hover:border-accent hover:text-accent text-sm"
            title="Previsualizar / Descargar"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="truncate max-w-[120px]">{file.name}</span>
          </button>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-monday text-gray-500 hover:bg-dark-hover hover:text-accent"
            title="Descargar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
          <button
            type="button"
            onClick={remove}
            className="p-1.5 rounded-monday text-gray-500 hover:bg-red-500/20 hover:text-red-400"
            title="Quitar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-2 py-1.5 rounded-monday border border-dashed border-dark-border text-gray-500 text-xs hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Subir PDF o JPG'}
        </button>
      )}
      {previewOpen && file && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setPreviewOpen(false)} aria-hidden />
          <div className="fixed inset-4 z-50 flex items-center justify-center p-4">
            <div className="bg-dark-card rounded-monday shadow-xl max-w-4xl max-h-full w-full h-full flex flex-col">
              <div className="flex justify-end p-2 border-b border-dark-border">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-monday bg-accent text-white text-sm mr-2"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="px-3 py-1 rounded-monday bg-dark-hover text-white text-sm"
                >
                  Cerrar
                </button>
              </div>
              <iframe
                src={file.url}
                title="Vista previa"
                className="flex-1 w-full min-h-0 rounded-b-monday"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
