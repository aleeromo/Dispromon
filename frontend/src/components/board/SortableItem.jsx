import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, item, children, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'Item',
      item,
    },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: isDragging ? 'relative' : 'static',
    zIndex: isDragging ? 9999 : 'auto',
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-monday-border hover:bg-monday-hover/50 transition-colors bg-white group/row ${
        isDragging ? 'shadow-lg ring-1 ring-monday-primary' : ''
      }`}
    >
      {/* We inject attributes and listeners into a specific "drag handle" inside children, 
          or here we can provide a context or render prop. 
          To keep it simple, we pass it down to a specific cell in the parent. */}
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { dragHandleProps: { ...attributes, ...listeners } });
        }
        return child;
      })}
    </tr>
  );
}
