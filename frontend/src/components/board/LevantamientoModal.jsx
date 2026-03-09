import { useState, useEffect, useRef } from 'react';
import { setCellValue } from '../../api/client';

const LEVANTAMIENTO_OPTIONS = [
  { id: 'pendiente', label: 'Pendiente', color: '#a0a0a0' },
  { id: 'programado', label: 'Programado', color: '#fdab3d' },
  { id: 'realizado', label: 'Realizado', color: '#00c875' },
];

export default function LevantamientoModal({ open, onClose, item, board, onRefresh }) {
  const [optionId, setOptionId] = useState(null);
  const [especificaciones, setEspecificaciones] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  const levantamientoCol = (board?.columns || []).find(
    (c) => c.title === 'Levantamiento' && c.type === 'status'
  );
  const value = item?.values?.find((v) => v.columnId === levantamientoCol?.id)?.value;
  const parsed = (() => {
    if (!value) return {};
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (open && item) {
      setOptionId(parsed.optionId ?? null);
      setEspecificaciones(parsed.especificaciones ?? '');
      setWhatsapp(parsed.whatsapp ?? '');
    }
  }, [open, item, parsed.optionId, parsed.especificaciones, parsed.whatsapp]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [open, onClose]);

  async function handleSave() {
    if (!item?.id || !levantamientoCol?.id) return;
    setSaving(true);
    try {
      await setCellValue(item.id, levantamientoCol.id, {
        optionId: optionId || null,
        especificaciones: especificaciones.trim() || null,
        whatsapp: whatsapp.trim() || null,
      });
      onRefresh?.();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-dark-card border border-dark-border rounded-monday shadow-xl z-50 p-6"
        role="dialog"
        aria-label="Levantamiento"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Levantamiento</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Estado</label>
            <div className="flex flex-wrap gap-2">
              {LEVANTAMIENTO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOptionId(opt.id)}
                  className={`px-3 py-1.5 rounded-monday text-sm font-medium ${
                    optionId === opt.id
                      ? 'text-white'
                      : 'bg-dark-hover text-gray-400 hover:text-white'
                  }`}
                  style={optionId === opt.id ? { backgroundColor: opt.color } : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Especificaciones</label>
            <textarea
              value={especificaciones}
              onChange={(e) => setEspecificaciones(e.target.value)}
              rows={4}
              className="w-full bg-dark-bg border border-dark-border rounded-monday px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent resize-y"
              placeholder="Detalles del levantamiento..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Número de WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-monday px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent"
              placeholder="Ej: +52 55 1234 5678"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-monday text-gray-400 hover:bg-dark-hover hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-monday bg-accent text-white font-medium disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  );
}
