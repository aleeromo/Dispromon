import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CustomPopover({ isOpen, onClose, triggerRef, children, width = 200, align = 'center' }) {
  const [coords, setCoords] = useState({ left: 0, top: 0 });
  const popoverRef = useRef(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.left + window.scrollX;
      let top = rect.bottom + window.scrollY;

      if (align === 'center') {
        left = left + (rect.width / 2) - (width / 2);
      } else if (align === 'right') {
        left = left + rect.width - width;
      }

      // Check right boundary
      if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 10;
      }
      
      // Check bottom boundary
      const estimatedHeight = 250; // estimate max height for picker
      if (top + estimatedHeight > window.innerHeight) {
        top = rect.top + window.scrollY - estimatedHeight; 
      }

      setCoords({ left, top });
    }
  }, [isOpen, triggerRef, width, align]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target) && triggerRef.current && !triggerRef.current.contains(e.target)) {
        onClose();
      }
    }
    // Timeout to prevent initial trigger click from closing it immediately
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="absolute z-[100] bg-white border border-monday-border rounded shadow-xl overflow-hidden flex flex-col"
      style={{
        left: coords.left,
        top: coords.top,
        width: width,
        maxHeight: '300px'
      }}
    >
      {children}
    </div>,
    document.body
  );
}
