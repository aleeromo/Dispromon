import { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCorners,
} from '@dnd-kit/core';
import { setCellValue } from '../../api/client';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

const defaultStatusOptions = [
  { id: 'done', label: 'Hecho', color: '#00c875' },
  { id: 'working', label: 'Trabajando', color: '#fdab3d' },
  { id: 'stuck', label: 'Estancado', color: '#e44258' },
];

function getValue(item, columnId) {
  const v = item.values?.find((x) => x.columnId === columnId);
  if (!v || v.value == null) return null;
  try {
    return JSON.parse(v.value);
  } catch {
    return v.value;
  }
}

export default function BoardKanban({ board, onRefresh, directorio }) {
  // En directorio usar columna "Estatus" (operativo); si no, primera columna status
  const statusColumn = (board.columns || []).find((c) =>
    directorio ? c.title === 'Estatus' && c.type === 'status' : c.type === 'status'
  ) || (board.columns || []).find((c) => c.type === 'status');
  const options = statusColumn?.settings
    ? JSON.parse(statusColumn.settings).options || defaultStatusOptions
    : defaultStatusOptions;

  const itemsByStatus = useMemo(() => {
    const map = {};
    options.forEach((opt) => {
      map[opt.id] = [];
    });
    map[''] = [];
    (board.groups || []).forEach((grp) => {
      (grp.items || []).forEach((item) => {
        const val = statusColumn ? getValue(item, statusColumn.id) : null;
        const optionId = val?.optionId ?? '';
        if (!map[optionId]) map[optionId] = [];
        map[optionId].push({ ...item, groupTitle: grp.title });
      });
    });
    return map;
  }, [board.groups, options, statusColumn]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  async function handleDragEnd(ev) {
    const { active, over } = ev;
    if (!over || !statusColumn || active.id === over.id) return;
    const itemId = String(active.id).replace('item-', '');
    const newStatusId = String(over.id).replace('status-', '');
    if (newStatusId.startsWith('item-')) return;
    try {
      await setCellValue(itemId, statusColumn.id, { optionId: newStatusId || null });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  }

  if (!statusColumn) {
    return (
      <div className="p-8 text-gray-400">
        Este board no tiene columna de tipo Status. Usa la vista Tabla para añadir una.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto flex gap-4 p-4">
        {options.map((opt) => (
          <KanbanColumn
            key={opt.id}
            id={`status-${opt.id}`}
            title={opt.label}
            color={opt.color}
            items={itemsByStatus[opt.id] || []}
          />
        ))}
        <KanbanColumn
          id="status-"
          title="Sin estado"
          color="#555"
          items={itemsByStatus[''] || []}
        />
      </div>
      <DragOverlay>
        {() => null}
      </DragOverlay>
    </DndContext>
  );
}
