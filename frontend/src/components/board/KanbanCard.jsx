import { useDraggable } from '@dnd-kit/core';

export default function KanbanCard({ item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${item.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-monday bg-dark-bg border border-dark-border mb-2 cursor-grab active:cursor-grabbing hover:border-accent/50 transition-colors ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="text-white font-medium text-sm">{item.name || 'Sin título'}</div>
      {item.groupTitle && (
        <div className="text-gray-500 text-xs mt-1">{item.groupTitle}</div>
      )}
    </div>
  );
}
