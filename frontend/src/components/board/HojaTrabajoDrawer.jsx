import { useEffect } from 'react';
import { updateItem } from '../../api/client';

function getFolio(item, columns) {
  const folioCol = columns?.find((c) => c.title === 'Folio');
  if (!folioCol) return '';
  const v = item.values?.find((x) => x.columnId === folioCol.id);
  if (!v?.value) return '';
  try {
    const parsed = JSON.parse(v.value);
    return parsed?.text ?? '';
  } catch {
    return '';
  }
}

function getLevantamientoData(item, columns) {
  const col = columns?.find((c) => c.title === 'Levantamiento' && c.type === 'status');
  if (!col) return { especificaciones: '', whatsapp: '' };
  const v = item.values?.find((x) => x.columnId === col.id);
  if (!v?.value) return { especificaciones: '', whatsapp: '' };
  try {
    const parsed = JSON.parse(v.value);
    return {
      especificaciones: parsed.especificaciones ?? '',
      whatsapp: parsed.whatsapp ?? '',
    };
  } catch {
    return { especificaciones: '', whatsapp: '' };
  }
}

export default function HojaTrabajoDrawer({ open, onClose, item, board, onRefresh }) {
  const folio = item ? getFolio(item, board?.columns) : '';
  const description = item?.description?.trim() || item?.name || 'Sin descripción';
  const levantamiento = item ? getLevantamientoData(item, board?.columns) : { especificaciones: '', whatsapp: '' };
  const materials = item?.materials ?? '';
  const finalMeasures = item?.finalMeasures ?? '';

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, onClose]);

  async function handleDescriptionBlur(e) {
    const text = e.target.value.trim();
    if (!item || text === (item.description || '')) return;
    try {
      await updateItem(item.id, { description: text || null });
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMaterialsBlur(e) {
    const text = e.target.value.trim();
    if (!item || text === (item.materials ?? '')) return;
    try {
      await updateItem(item.id, { materials: text || null });
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleFinalMeasuresBlur(e) {
    const text = e.target.value.trim();
    if (!item || text === (item.finalMeasures ?? '')) return;
    try {
      await updateItem(item.id, { finalMeasures: text || null });
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 w-full max-w-md h-full bg-dark-card border-l border-dark-border shadow-xl z-50 flex flex-col"
        role="dialog"
        aria-label="Hoja de Trabajo"
      >
        <div className="p-4 border-b border-dark-border flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-white">Hoja de Trabajo</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-monday text-gray-400 hover:bg-dark-hover hover:text-white"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Folio</p>
            <p className="text-4xl font-bold text-accent tracking-tight">
              {folio || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Descripción del proyecto</p>
            <textarea
              defaultValue={description}
              onBlur={handleDescriptionBlur}
              rows={3}
              className="w-full bg-dark-bg border border-dark-border rounded-monday px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent resize-y"
              placeholder="Descripción para el equipo de taller..."
            />
          </div>
          <div className="border-t border-dark-border pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Datos del Levantamiento</p>
            <div className="space-y-2 text-sm text-gray-300 bg-dark-bg/50 rounded-monday p-3">
              {levantamiento.especificaciones ? (
                <p><span className="text-gray-500">Especificaciones:</span> {levantamiento.especificaciones}</p>
              ) : null}
              {levantamiento.whatsapp ? (
                <p><span className="text-gray-500">WhatsApp:</span> {levantamiento.whatsapp}</p>
              ) : null}
              {!levantamiento.especificaciones && !levantamiento.whatsapp && (
                <p className="text-gray-500">Sin datos de levantamiento. Edita la celda Levantamiento en la tabla.</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Materiales</p>
            <textarea
              defaultValue={materials}
              onBlur={handleMaterialsBlur}
              rows={3}
              className="w-full bg-dark-bg border border-dark-border rounded-monday px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent resize-y"
              placeholder="Materiales para el taller..."
            />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Medidas finales</p>
            <textarea
              defaultValue={finalMeasures}
              onBlur={handleFinalMeasuresBlur}
              rows={3}
              className="w-full bg-dark-bg border border-dark-border rounded-monday px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent resize-y"
              placeholder="Medidas finales para el taller..."
            />
          </div>
        </div>
      </aside>
    </>
  );
}
