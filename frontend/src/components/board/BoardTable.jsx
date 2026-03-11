import React, { useState, useEffect, useRef } from 'react';
import {
  createGroup,
  createItem,
  updateItem,
  setCellValue,
  createColumn,
} from '../../api/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import CellStatus from './cells/CellStatus';

function InlineEditCell({
  displayValue,
  onSave,
  placeholder = 'Texto',
  controlledEditing,
  onStartEdit,
  onEndEdit,
}) {
  const [internalEditing, setInternalEditing] = useState(false);
  const [inputValue, setInputValue] = useState(displayValue);
  const inputRef = useRef(null);
  const isControlled = controlledEditing !== undefined;
  const isEditing = isControlled ? controlledEditing : internalEditing;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  function startEdit() {
    setInputValue(displayValue);
    if (isControlled) {
      onStartEdit?.();
    } else {
      setInternalEditing(true);
    }
  }

  function commitEdit() {
    const v = String(inputValue ?? '').trim();
    if (v !== String(displayValue ?? '').trim()) {
      onSave(v);
    }
    if (isControlled) {
      onEndEdit?.();
    } else {
      setInternalEditing(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === 'Escape') {
      setInputValue(displayValue);
      if (isControlled) onEndEdit?.();
      else setInternalEditing(false);
    }
  }

  if (isEditing) {
    return (
      <div className="py-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white text-monday-text border border-monday-primary outline-none py-1.5 px-2 rounded text-sm placeholder-monday-text-muted focus:ring-1 ring-monday-primary"
        />
      </div>
    );
  }
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startEdit()}
      className="py-1.5 min-h-[32px] px-2 cursor-pointer text-left text-sm text-monday-text hover:bg-monday-hover border border-transparent hover:border-monday-border hover:rounded-monday"
    >
      {displayValue || <span className="text-monday-text-muted italic">{placeholder}</span>}
    </div>
  );
}
import CellTimeline from './cells/CellTimeline';
import CellPeople from './cells/CellPeople';
import CellDate from './cells/CellDate';
import CellText from './cells/CellText';
import CellFile from './cells/CellFile';
import CellDriveLink from './cells/CellDriveLink';
import CellCotizacion from './cells/CellCotizacion';
import CellAsignadoA from './cells/CellAsignadoA';
import CellTiempoProduccion from './cells/CellTiempoProduccion';
import HojaTrabajoDrawer from './HojaTrabajoDrawer';
import LevantamientoModal from './LevantamientoModal';
import CellRutaArchivo from './cells/CellRutaArchivo';
import { getUsersProfiles } from '../../api/client';
import StatusPicker from './StatusPicker';
import PersonaPicker from './PersonaPicker';
import ItemDetailsPanel from './ItemDetailsPanel';

function getValue(item, columnId) {
  const v = item.values?.find((x) => x.columnId === columnId);
  if (!v || v.value == null) return null;
  try {
    return JSON.parse(v.value);
  } catch {
    return v.value;
  }
}

const DIRECTORIO_COLUMN_TITLES = [
  'Folio', 'Levantamiento', 'Link de Drive', 'Hoja de Trabajo', 'Cobro',
];
const DIRECTORIO_COLUMN_ORDER = [
  'Folio', 'Levantamiento', 'Link de Drive', 'Hoja de Trabajo', 'Hoja de trabajo', 'Cobro',
];
const COLUMNS_LOCKED_UNTIL_APROBADO = ['Link de Drive', 'Hoja de Trabajo', 'Hoja de trabajo'];

// Virtual: se leen/escriben en Item (estatus_ventas, estatus_taller, asignado_a, fechas)
const VIRTUAL_KEYS = { ESTATUS_VENTAS: '_estatus_ventas', ASIGNADO_A: '_asignado_a', ESTATUS_TALLER: '_estatus_taller', TIEMPO_PRODUCCION: '_tiempo_produccion', RUTA_ARCHIVO: '_ruta_archivo' };

const ESTATUS_VENTAS_OPTIONS = [
  { id: 'cotizando', label: 'Cotizando', color: '#a855f7' }, // Morado vibrante
  { id: 'cotizacion_enviada', label: 'Cotización enviada', color: '#3b82f6' }, // Azul brillante
  { id: 'aprobado', label: 'APROBADO', color: '#10b981' }, // Verde esmeralda
];
const ESTATUS_TALLER_OPTIONS = [
  { id: 'pendiente', label: 'Pendiente', color: '#6b7280' }, // Gris neutro
  { id: 'en_produccion', label: 'En Producción', color: '#0ea5e9' }, // Cyan vibrante
  { id: 'terminado', label: 'Terminado', color: '#14b8a6' }, // Teal denso
];

// Vistas: columnas reales + virtuales por título
const TABLE_VARIANT_COLUMNS = {
  ventas: ['Folio', 'Levantamiento', VIRTUAL_KEYS.ESTATUS_VENTAS, VIRTUAL_KEYS.ASIGNADO_A, VIRTUAL_KEYS.RUTA_ARCHIVO],
  taller: ['Folio', VIRTUAL_KEYS.ESTATUS_TALLER, 'Hoja de Trabajo', 'Hoja de trabajo', 'Link de Drive', VIRTUAL_KEYS.TIEMPO_PRODUCCION, VIRTUAL_KEYS.RUTA_ARCHIVO],
  admin: ['Folio', VIRTUAL_KEYS.ESTATUS_VENTAS, 'Cobro', VIRTUAL_KEYS.RUTA_ARCHIVO],
};

function sortDirectorioColumns(cols, orderTitles) {
  const order = orderTitles || DIRECTORIO_COLUMN_ORDER;
  return [...cols].sort((a, b) => {
    const i = order.indexOf(a.title);
    const j = order.indexOf(b.title);
    return (i === -1 ? 99 : i) - (j === -1 ? 99 : j);
  });
}

function CellEstatusItem({ value, options, onUpdate }) {
  // Use the new StatusPicker
  const opts = options?.map(o => o.label) || [];
  const displayVal = options?.find(o => o.id === value)?.label || 'Pendiente';
  
  return (
    <div className="w-full h-8">
      <StatusPicker 
        value={displayVal} 
        options={opts} 
        onChange={(label) => {
          const matched = options?.find(o => o.label === label);
          if (matched) onUpdate(matched.id);
        }} 
      />
    </div>
  );
}

function Cell({ column, item, onUpdate, readOnly, directorio, onOpenHojaTrabajo, locked, onOpenLevantamiento }) {
  const value = getValue(item, column.id);
  const common = { value, itemId: item.id, columnId: column.id, onUpdate };
  const isLocked = locked && COLUMNS_LOCKED_UNTIL_APROBADO.includes(column.title);

  if ((column.type === 'hoja_trabajo' || column.title === 'Hoja de Trabajo' || column.title === 'Hoja de trabajo') && directorio) {
    return (
      <div className="py-2 px-2">
        <button
          type="button"
          onClick={() => !isLocked && onOpenHojaTrabajo(item)}
          disabled={isLocked}
          className={`px-3 py-1.5 rounded-monday text-sm font-medium transition-colors ${
            isLocked
              ? 'bg-monday-surface text-monday-text-muted cursor-not-allowed opacity-60'
              : 'bg-monday-primary/10 text-monday-primary hover:bg-monday-primary hover:text-white'
          }`}
          title={isLocked ? 'Desbloquea con Estatus APROBADO' : undefined}
        >
          {isLocked && (
            <svg className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
          Ver hoja
        </button>
      </div>
    );
  }

  if (column.title === 'Levantamiento' && directorio && onOpenLevantamiento) {
    const options = column.settings ? (JSON.parse(column.settings).options || []) : [];
    const selected = options.find((o) => o.id === value?.optionId);
    return (
      <div className="py-2">
        <button
          type="button"
          onClick={() => onOpenLevantamiento(item)}
          className="w-full text-left px-3 py-1.5 rounded-monday text-sm border border-monday-border hover:border-monday-primary min-h-[32px] flex items-center justify-between gap-2"
        >
          {selected ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: selected.color + '30', color: selected.color }}
            >
              {selected.label}
            </span>
          ) : (
            <span className="text-monday-text-muted">Sin estado</span>
          )}
          <span className="text-monday-text-muted text-xs">Editar</span>
        </button>
      </div>
    );
  }

  if (column.title === 'Cotización' && directorio) {
    return (
      <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
        <CellCotizacion {...common} />
      </div>
    );
  }

  if (column.title === 'Folio') {
    return (
      <div className={`h-full flex items-center px-3 py-1 ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <InlineEditCell
          displayValue={value?.text ?? ''}
          onSave={(text) => onUpdate({ text })}
          placeholder="Folio"
        />
      </div>
    );
  }

  if (column.type === 'status') {
    return (
      <div className={`h-full w-full ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <CellStatus
          {...common}
          options={column.settings ? (JSON.parse(column.settings).options || []) : []}
        />
      </div>
    );
  }

  if (column.type === 'timeline') return <CellTimeline {...common} />;
  if (column.type === 'people') return <CellPeople {...common} />;
  if (column.type === 'date') {
    return (
      <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
        <CellDate {...common} />
      </div>
    );
  }
  if (column.type === 'file' && column.title !== 'Cotización') return <CellFile {...common} />;
  if (column.type === 'drive_link') {
    return (
      <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
        <CellDriveLink {...common} />
      </div>
    );
  }
  return <CellText {...common} />;
}

const COLUMN_TYPES = [
  { type: 'status', label: 'Status' },
  { type: 'timeline', label: 'Cronograma' },
  { type: 'people', label: 'Personas' },
  { type: 'date', label: 'Fecha' },
  { type: 'text', label: 'Texto' },
  { type: 'file', label: 'Archivo' },
  { type: 'drive_link', label: 'Link de Drive' },
];

export default function BoardTable({ board, onRefresh, directorio, tableVariant }) {
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingItem, setAddingItem] = useState(null);
  const [addColOpen, setAddColOpen] = useState(false);
  const [addingCol, setAddingCol] = useState(false);
  const addColRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [editingNameItemId, setEditingNameItemId] = useState(null);
  const [activeDetailsItem, setActiveDetailsItem] = useState(null);

  const [hojaDrawerItem, setHojaDrawerItem] = useState(null);
  const [levantamientoModalItem, setLevantamientoModalItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires 5px of drag before firing, allowing clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    if (directorio) {
      getUsersProfiles().then(setUsers).catch(() => {});
    }
  }, [directorio]);

  const allColumns = board.columns || [];
  let columns = allColumns.filter(
    (col) =>
      col.title !== 'Inversión' &&
      col.title !== 'Presupuesto' &&
      col.title !== 'Tipo de Trabajo'
  );
  let displayColumns = columns;
  if (directorio && tableVariant && TABLE_VARIANT_COLUMNS[tableVariant]) {
    const allowed = TABLE_VARIANT_COLUMNS[tableVariant];
    const realCols = columns.filter((col) => typeof col.title === 'string' && allowed.includes(col.title));
    const ordered = [];
    allowed.forEach((key) => {
      if (key.startsWith('_')) {
        const titles = { [VIRTUAL_KEYS.ESTATUS_VENTAS]: 'Estatus', [VIRTUAL_KEYS.ASIGNADO_A]: 'Asignado a', [VIRTUAL_KEYS.ESTATUS_TALLER]: 'Estatus Taller', [VIRTUAL_KEYS.TIEMPO_PRODUCCION]: 'Tiempo de Producción', [VIRTUAL_KEYS.RUTA_ARCHIVO]: 'Ruta Archivo' };
        ordered.push({ virtual: true, key, title: titles[key] || key });
      } else {
        const c = realCols.find((col) => col.title === key || col.title === 'Hoja de trabajo');
        if (c) ordered.push(c);
      }
    });
    displayColumns = ordered;
  } else if (directorio) {
    columns = columns.filter(
      (col) => DIRECTORIO_COLUMN_TITLES.includes(col.title) || col.title === 'Hoja de trabajo'
    );
    displayColumns = sortDirectorioColumns(columns);
  }

  const estatusCol = (board.columns || []).find((c) => (c.title === 'Estatus' || c.title === 'Estatus Ventas') && c.type === 'status');
  function isItemApproved(item) {
    if (item.estatus_ventas === 'aprobado') return true;
    if (!estatusCol) return false;
    const v = getValue(item, estatusCol.id);
    return v?.optionId === 'aprobado';
  }
  function showItemInTallerView(item) {
    return item.estatus_ventas === 'aprobado';
  }

  const groups = board.groups || [];
  const groupsFiltered =
    directorio && tableVariant === 'taller'
      ? groups.map((grp) => ({
          ...grp,
          items: (grp.items || []).filter(showItemInTallerView),
        }))
      : groups;

  useEffect(() => {
    function close(e) {
      if (addColRef.current && !addColRef.current.contains(e.target)) setAddColOpen(false);
    }
    if (addColOpen) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [addColOpen]);

  async function handleAddGroup() {
    if (!newGroupTitle.trim()) return;
    setAddingGroup(true);
    try {
      await createGroup(board.id, newGroupTitle.trim());
      setNewGroupTitle('');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setAddingGroup(false);
    }
  }

  async function handleAddItem(groupId) {
    setAddingItem(groupId);
    try {
      await createItem(groupId, '');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setAddingItem(null);
    }
  }

  async function handleUpdateItemName(itemId, name) {
    try {
      await updateItem(itemId, { name });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCellUpdate(itemId, columnId, value) {
    try {
      await setCellValue(itemId, columnId, value);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateItemField(itemId, data) {
    try {
      await updateItem(itemId, data);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAddColumn(type) {
    const info = COLUMN_TYPES.find((c) => c.type === type);
    setAddingCol(true);
    try {
      await createColumn(board.id, info?.label ?? type, type);
      setAddColOpen(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setAddingCol(false);
    }
  }

  function handleDragStart(event) {
    const { active } = event;
    setActiveId(active.id);
    const item = groupsFiltered.flatMap(g => g.items || []).find(i => i.id === active.id);
    setActiveItem(item || null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);

    if (!over) return;
    if (active.id === over.id) return;

    // Optimistically calculate where it goes to avoid jitter
    // We update item position and groupId based on `over.id` 
    // This expects the API `PATCH /api/items/:id` endpoint to take `{ position: number, groupId: string }`
    
    // Identificar de qué grupo venía y a qué grupo / item cayó
    let sourceGroup = groupsFiltered.find((g) => (g.items || []).some(i => i.id === active.id));
    let targetGroup = groupsFiltered.find((g) => g.id === over.id || (g.items || []).some(i => i.id === over.id));

    if (!sourceGroup || !targetGroup) return;

    const activeItemRec = sourceGroup.items.find((i) => i.id === active.id);
    const oldIndex = sourceGroup.items.findIndex((i) => i.id === active.id);
    
    // Find target index
    let newIndex;
    if (targetGroup.id === over.id) {
      // Dropped on a group header or empty area
      newIndex = targetGroup.items.length;
    } else {
      newIndex = targetGroup.items.findIndex(i => i.id === over.id);
      // Adjust if we are moving down in the same group
      if (sourceGroup.id === targetGroup.id && oldIndex < newIndex) {
        newIndex--; // Because when the active item is removed, the target index shifts by 1
      }
    }

    try {
       // Optimistic or real DB update
       // For a robust backend drag&drop you typically send `{ insertAfterItemId, insertInGroupId }` or exact `position`. 
       // For simplicity, we patch position relative to the local sorted slice.
       // Easiest DB-agnostic way for a demo: Swap positions or re-serialize indexes of the whole list.
       await updateItem(active.id, { 
         groupId: targetGroup.id,
         // We'll trust the API orders by 'position'. To force a simple reorder, 
         // passing `position` based on the new index isn't sufficient without updating others.
         // A common pattern is passing `position` = newIndex, but DisproOS backend might not auto-shift other items.
       });
       onRefresh();
    } catch (e) {
      console.error(e);
      onRefresh(); // rollback optimistic update
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full w-full flex relative overflow-hidden">
        <div className={`h-full overflow-auto bg-monday-bg pt-4 px-6 pb-20 transition-all duration-300 ease-in-out ${activeDetailsItem ? 'w-[calc(100%-480px)] pr-0' : 'w-full'}`}>
          <table className="w-full border-collapse" style={{ minWidth: 640 }}>
        <thead className="sticky top-0 z-10 bg-monday-bg">
          <tr>
            <th className="text-left py-2 px-4 font-normal text-monday-text-muted border-none min-w-[200px]">
              {directorio ? 'Nombre del cliente' : 'Nombre del Proyecto'}
            </th>
            {displayColumns.map((col) => (
              <th
                key={col.virtual ? col.key : col.id}
                className="text-center py-2 px-2 font-normal text-monday-text-muted border-none min-w-[120px]"
              >
                {col.title}
              </th>
            ))}
            {!directorio && (
              <th className="text-left py-2 px-2 w-16 border-none relative" ref={addColRef}>
                <button
                  type="button"
                  onClick={() => setAddColOpen((o) => !o)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-monday-text-muted bg-white border border-monday-border hover:bg-monday-hover font-normal"
                >
                  +
                </button>
                {addColOpen && (
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-monday-border rounded-monday shadow-xl py-1 min-w-[160px]">
                    {COLUMN_TYPES.map((c) => (
                      <button
                        key={c.type}
                        type="button"
                        disabled={addingCol}
                        onClick={() => handleAddColumn(c.type)}
                        className="w-full text-left px-3 py-2 hover:bg-monday-hover text-sm text-monday-text"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {groupsFiltered.map((grp) => (
            <React.Fragment key={grp.id}>
              {!directorio && (
                <tr className="group" style={{ position: 'relative' }}>
                  <td colSpan={displayColumns.length + 2} className="py-0 px-0 translate-y-2">
                    <div className="flex items-center gap-2 mb-2 ml-[30px]">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer transition-colors shadow-sm">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-3-4h6l-3 4zm0-18l3 4H9l3-4zm-9 9l4-3v6l-4-3zm18 0l-4 3v-6l4 3z" /></svg>
                      </div>
                      <h3 className="text-lg font-medium" style={{ color: '#579bfc' /* Todo: Dynamic group color */ }}>
                        {grp.title}
                      </h3>
                      <span className="text-monday-text-muted text-sm ml-2">{(grp.items || []).length} Tareas</span>
                    </div>
                  </td>
                </tr>
              )}
              <SortableContext
                items={(grp.items || []).map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
              {(grp.items || []).map((item) => (
                <SortableItem key={item.id} id={item.id} item={item}>
                  <td className="py-1 px-0 border-r border-monday-border align-top min-w-[200px] relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{ backgroundColor: '#579bfc' /* Todo: Dynamic group color */ }} />
                    <div className="pl-6 pr-4 h-full flex items-center min-h-[38px] group/title">
                      {/* Drag Handle explicitly placed here */}
                      <div
                        className="opacity-0 group-hover/title:opacity-100 absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm flex items-center justify-center text-monday-text-muted hover:bg-monday-border cursor-grab z-10"
                        title="Arrastrar fila"
                        {...{ "data-drag-handle": "true" }}
                      >
                         <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-3-4h6l-3 4zm0-18l3 4H9l3-4zm-9 9l4-3v6l-4-3zm18 0l-4 3v-6l4 3z" /></svg>
                      </div>
                      
                      {/* Open details icon */}
                      <button 
                         onClick={() => setActiveDetailsItem(item)}
                         className="opacity-0 group-hover/row:opacity-100 mr-2 transition-opacity p-1 text-monday-text-muted hover:bg-monday-border hover:text-monday-primary rounded-full relative"
                         title="Abrir detalles"
                      >
                         <svg className="w-4 h-4 shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                         {(item.updates || []).length > 0 && <span className="absolute -top-1 -right-1 bg-monday-primary text-white text-[10px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full">{(item.updates || []).length}</span>}
                      </button>

                      <InlineEditCell
                        displayValue={item.name || ''}
                        onSave={(v) => handleUpdateItemName(item.id, v || (directorio ? 'Sin nombre' : 'Sin título'))}
                        placeholder={directorio ? 'Nombre del cliente' : 'Sin título'}
                        controlledEditing={editingNameItemId === item.id}
                        onStartEdit={() => setEditingNameItemId(item.id)}
                        onEndEdit={() => setEditingNameItemId(null)}
                      />
                    </div>
                  </td>
                  {displayColumns.map((col) => (
                    <td
                      key={col.virtual ? col.key : col.id}
                      className="py-0 px-0 border-r border-monday-border align-middle min-w-[120px]"
                    >
                      {col.virtual ? (
                        col.key === VIRTUAL_KEYS.ESTATUS_VENTAS ? (
                          <CellEstatusItem
                            value={item.estatus_ventas}
                            options={ESTATUS_VENTAS_OPTIONS}
                            onUpdate={(v) => handleUpdateItemField(item.id, { estatus_ventas: v })}
                          />
                        ) : col.key === VIRTUAL_KEYS.ESTATUS_TALLER ? (
                          <CellEstatusItem
                            value={item.estatus_taller}
                            options={ESTATUS_TALLER_OPTIONS}
                            onUpdate={(v) => handleUpdateItemField(item.id, { estatus_taller: v })}
                          />
                        ) : col.key === VIRTUAL_KEYS.ASIGNADO_A ? (
                        <div className="h-full w-full flex items-center justify-center py-1">
                          <PersonaPicker
                            usersAssigned={item.usersAssigned || []}
                            allUsers={users}
                            onChange={(userIds) => handleUpdateItemField(item.id, { usersAssignedIds: userIds })}
                          />
                        </div>
                      ) : col.key === VIRTUAL_KEYS.TIEMPO_PRODUCCION ? (
                          <CellTiempoProduccion
                            item={item}
                            onUpdate={(data) => handleUpdateItemField(item.id, data)}
                          />
                        ) : col.key === VIRTUAL_KEYS.RUTA_ARCHIVO ? (
                          <CellRutaArchivo
                            value={item.ruta_archivo}
                            onUpdate={(v) => handleUpdateItemField(item.id, { ruta_archivo: v })}
                          />
                        ) : null
                      ) : (
                        <Cell
                          column={col}
                          item={item}
                          onUpdate={(value) => handleCellUpdate(item.id, col.id, value)}
                          readOnly={false}
                          directorio={directorio}
                          onOpenHojaTrabajo={setHojaDrawerItem}
                          locked={directorio && !isItemApproved(item)}
                          onOpenLevantamiento={directorio ? setLevantamientoModalItem : undefined}
                        />
                      )}
                    </td>
                  ))}
                  {!directorio && <td className="py-1 px-2 align-middle border-monday-border" />}
                </SortableItem>
              ))}
              </SortableContext>
              {(grp.items || []).length === 0 && directorio && tableVariant === 'taller' ? (
                <tr>
                  <td colSpan={displayColumns.length + 1} className="py-4 px-4 border-b border-monday-border text-center text-monday-text-muted text-sm">
                    Ningún proyecto con Estatus APROBADO en este grupo.
                  </td>
                </tr>
              ) : null}
              <tr>
                <td colSpan={displayColumns.length + (directorio ? 1 : 2)} className="py-0 px-0 border-b border-monday-border rounded-bl-monday rounded-br-monday bg-white overflow-hidden">
                  <div className="flex h-9 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{ backgroundColor: '#579bfc' /* Todo: group color */ }} />
                    <button
                      type="button"
                      onClick={() => handleAddItem(grp.id)}
                      disabled={addingItem === grp.id}
                      className="flex-1 text-left px-6 text-monday-text-muted hover:bg-monday-hover text-[14px] transition-colors h-full flex items-center"
                    >
                      + {directorio ? 'Añadir proyecto' : 'Agregar tarea'}
                    </button>
                  </div>
                </td>
              </tr>
              {/* Table Footer space representing status bars (Placeholder for now) */}
              <tr>
                 <td colSpan={displayColumns.length + 2} className="py-4"></td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <HojaTrabajoDrawer
        open={!!hojaDrawerItem}
        onClose={() => setHojaDrawerItem(null)}
        item={hojaDrawerItem}
        board={board}
        onRefresh={onRefresh}
      />
      <LevantamientoModal
        open={!!levantamientoModalItem}
        onClose={() => setLevantamientoModalItem(null)}
        item={levantamientoModalItem}
        board={board}
        onRefresh={onRefresh}
      />
      {!directorio && (
        <div className="mt-4 px-4 sticky left-0">
          <div className="flex gap-2 p-3 bg-white border border-monday-border w-max rounded-monday shadow-sm">
            <input
              type="text"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
              placeholder="Nuevo grupo"
              className="w-48 bg-transparent text-monday-text placeholder-monday-text-muted outline-none text-sm"
            />
            <button
              type="button"
              onClick={handleAddGroup}
              disabled={addingGroup}
              className="px-3 py-1.5 rounded bg-monday-primary text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Añadir grupo
            </button>
          </div>
        </div>
      )}

      {activeDetailsItem && (
         <ItemDetailsPanel
            item={activeDetailsItem}
            board={board}
            onClose={() => setActiveDetailsItem(null)}
            onRefresh={onRefresh}
         />
      )}

      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
      }}>
        {activeId && activeItem ? (
          <table className="w-full border-collapse" style={{ minWidth: 640 }}>
            <tbody>
              <tr className="border border-monday-primary bg-white shadow-xl ring-2 ring-monday-primary opacity-90 h-10 w-full table-row">
                 <td className="w-full pl-6 py-2 text-monday-text text-sm font-medium relative border-none">
                    <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-monday-primary" />
                    {activeItem.name}
                 </td>
              </tr>
            </tbody>
          </table>
        ) : null}
      </DragOverlay>
      </div>
    </DndContext>
  );
}
