import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ id, title, color, items }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-72 rounded-monday bg-dark-card border flex flex-col transition-colors ${
        isOver ? 'border-accent ring-1 ring-accent/50' : 'border-dark-border'
      }`}
    >
      <div
        className="px-4 py-3 rounded-t-monday font-medium text-white flex items-center gap-2"
        style={{ backgroundColor: color + '30', borderBottom: `2px solid ${color}` }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {title}
        <span className="text-gray-400 text-sm ml-auto">{items.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 min-h-[200px]">
        <SortableContext items={items.map((i) => `item-${i.id}`)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
