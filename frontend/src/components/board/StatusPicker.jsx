import { useState, useRef } from 'react';
import CustomPopover from '../common/CustomPopover';

// Colores de ejemplo basados en Monday
export const STATUS_COLORS = {
  'Terminado': { bg: '#00c875', text: '#fff' },
  'Listo': { bg: '#00c875', text: '#fff' },
  'En Producción': { bg: '#fdab3d', text: '#fff' },
  'En curso': { bg: '#fdab3d', text: '#fff' },
  'Pendiente': { bg: '#c4c4c4', text: '#fff' },
  'Detenido': { bg: '#e2445c', text: '#fff' },
  'Cotizando': { bg: '#579bfc', text: '#fff' },
  'Cotización enviada': { bg: '#a25ddc', text: '#fff' },
  'APROBADO': { bg: '#00c875', text: '#fff' },
  'default': { bg: '#c4c4c4', text: '#fff' },
};

export default function StatusPicker({ value, options = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  const currentStyle = STATUS_COLORS[value] || STATUS_COLORS['default'];
  const displayValue = value || 'Pendiente';

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative w-full h-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90 group"
        style={{ backgroundColor: currentStyle.bg, color: currentStyle.text }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <span className="text-[13px] font-medium truncate px-1">{displayValue}</span>
        
        {/* Efecto de "oreja doblada" (corner fold overlay) que aparece en hover como Monday */}
        <div className="absolute top-0 right-0 w-0 h-0 
                        border-t-[8px] border-t-black/20 
                        border-l-[8px] border-l-transparent 
                        opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <CustomPopover isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={triggerRef} width={200} align="center">
        <div className="p-2 space-y-1 bg-white">
          {options.map((opt) => {
            const style = STATUS_COLORS[opt] || STATUS_COLORS['default'];
            return (
              <button
                key={opt}
                className="w-full text-left px-2 py-1.5 text-sm hover:opacity-90 transition-opacity rounded flex items-center justify-center relative"
                style={{ backgroundColor: style.bg, color: style.text }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                <span className="truncate">{opt}</span>
              </button>
            );
          })}
        </div>
      </CustomPopover>
    </>
  );
}
