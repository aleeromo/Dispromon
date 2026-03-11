import { useState, useRef } from 'react';
import CustomPopover from '../common/CustomPopover';

export default function PersonaPicker({ usersAssigned = [], allUsers = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);

  // Helper to get initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const toggleUser = (userId) => {
    const currentIds = usersAssigned.map(u => u.id);
    let newIds;
    if (currentIds.includes(userId)) {
      newIds = currentIds.filter(id => id !== userId);
    } else {
      newIds = [...currentIds, userId];
    }
    onChange(newIds);
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative w-full h-full flex items-center justify-center cursor-pointer hover:bg-monday-hover transition-colors px-1"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {usersAssigned.length === 0 ? (
          <div className="w-7 h-7 rounded-full border border-dashed border-monday-text-muted flex items-center justify-center text-monday-text-muted hover:border-monday-primary hover:text-monday-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        ) : (
          <div className="flex -space-x-2 items-center justify-center">
            {usersAssigned.slice(0, 3).map((u, i) => (
              <div 
                key={u.id}
                className="w-7 h-7 rounded-full bg-monday-primary text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm ring-1 ring-black/5"
                style={{ zIndex: 10 - i }}
                title={u.nombre}
              >
                {getInitials(u.nombre)}
              </div>
            ))}
            {usersAssigned.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-monday-surface text-monday-text-muted flex items-center justify-center text-[10px] font-medium border-2 border-white shadow-sm ring-1 ring-black/5 z-0">
                +{usersAssigned.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      <CustomPopover isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={triggerRef} width={220} align="center">
        <div className="p-2 bg-white flex flex-col">
          <h4 className="text-xs font-medium text-monday-text-muted uppercase tracking-wider mb-2 px-1">Asignar a</h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {allUsers.map((u) => {
              const isSelected = usersAssigned.some(assigned => assigned.id === u.id);
              return (
                <button
                  key={u.id}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-2 transition-colors ${
                    isSelected ? 'bg-monday-primary/10 text-monday-primary font-medium' : 'text-monday-text hover:bg-monday-hover'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleUser(u.id);
                  }}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${isSelected ? 'bg-monday-primary' : 'bg-gray-400'}`}>
                    {getInitials(u.nombre)}
                  </div>
                  <span className="truncate flex-1">{u.nombre}</span>
                  {isSelected && (
                    <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CustomPopover>
    </>
  );
}
