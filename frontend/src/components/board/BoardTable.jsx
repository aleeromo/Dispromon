import React, { useState, useEffect, useRef } from 'react';
import {
  createGroup,
  createItem,
  updateItem,
  setCellValue,
  createColumn,
} from '../../api/client';
import CellStatus from './cells/CellStatus';
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
import { getUsersProfiles } from '../../api/client';

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
const VIRTUAL_KEYS = { ESTATUS_VENTAS: '_estatus_ventas', ASIGNADO_A: '_asignado_a', ESTATUS_TALLER: '_estatus_taller', TIEMPO_PRODUCCION: '_tiempo_produccion' };

const ESTATUS_VENTAS_OPTIONS = [
  { id: 'cotizando', label: 'Cotizando', color: '#9ca3af' },
  { id: 'cotizacion_enviada', label: 'Cotización enviada', color: '#3b82f6' },
  { id: 'aprobado', label: 'APROBADO', color: '#22c55e' },
];
const ESTATUS_TALLER_OPTIONS = [
  { id: 'pendiente', label: 'Pendiente', color: '#a0a0a0' },
  { id: 'en_produccion', label: 'En Producción', color: '#fdab3d' },
  { id: 'terminado', label: 'Terminado', color: '#00c875' },
];

// Vistas: columnas reales + virtuales por título
const TABLE_VARIANT_COLUMNS = {
  ventas: ['Folio', 'Levantamiento', VIRTUAL_KEYS.ESTATUS_VENTAS, VIRTUAL_KEYS.ASIGNADO_A],
  taller: ['Folio', VIRTUAL_KEYS.ESTATUS_TALLER, 'Hoja de Trabajo', 'Hoja de trabajo', 'Link de Drive', VIRTUAL_KEYS.TIEMPO_PRODUCCION],
  admin: ['Folio', VIRTUAL_KEYS.ESTATUS_VENTAS, 'Cobro'],
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
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options?.find((o) => o.id === value);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-3 py-1.5 rounded-monday text-sm border border-transparent hover:border-dark-border min-h-[32px] flex items-center"
      >
        {selected ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: selected.color + '30', color: selected.color }}>
            {selected.label}
          </span>
        ) : (
          <span className="text-gray-500">Sin estado</span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-dark-card border border-dark-border rounded-monday shadow-xl py-1 min-w-[140px]">
          {options?.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onUpdate(opt.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-dark-hover flex items-center gap-2 text-sm text-white"
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
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
              ? 'bg-dark-card text-gray-500 cursor-not-allowed opacity-60'
              : 'bg-accent/20 text-accent hover:bg-accent hover:text-white'
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
          className="w-full text-left px-3 py-1.5 rounded-monday text-sm border border-dark-border hover:border-accent min-h-[32px] flex items-center justify-between gap-2"
        >
          {selected ? (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              style={{ backgroundColor: selected.color + '30', color: selected.color }}
            >
              {selected.label}
            </span>
          ) : (
            <span className="text-gray-500">Sin estado</span>
          )}
          <span className="text-gray-500 text-xs">Editar</span>
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

  if (column.type === 'status') {
    return (
      <div className={isLocked ? 'opacity-60 pointer-events-none' : ''}>
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

  const [hojaDrawerItem, setHojaDrawerItem] = useState(null);
  const [levantamientoModalItem, setLevantamientoModalItem] = useState(null);

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
        const titles = { [VIRTUAL_KEYS.ESTATUS_VENTAS]: 'Estatus', [VIRTUAL_KEYS.ASIGNADO_A]: 'Asignado a', [VIRTUAL_KEYS.ESTATUS_TALLER]: 'Estatus Taller', [VIRTUAL_KEYS.TIEMPO_PRODUCCION]: 'Tiempo de Producción' };
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

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse" style={{ minWidth: 640 }}>
        <thead className="sticky top-0 z-10 bg-dark-card border-b border-dark-border">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-gray-400 border-r border-dark-border min-w-[200px]">
              {directorio ? 'Nombre del cliente' : 'Nombre del Proyecto'}
            </th>
            {displayColumns.map((col) => (
              <th
                key={col.virtual ? col.key : col.id}
                className="text-left py-3 px-4 font-medium text-gray-400 border-r border-dark-border last:border-r-0 min-w-[120px]"
              >
                {col.title}
              </th>
            ))}
            {!directorio && (
              <th className="text-left py-3 px-4 w-32 border-dark-border relative" ref={addColRef}>
                <button
                  type="button"
                  onClick={() => setAddColOpen((o) => !o)}
                  className="text-gray-500 hover:text-accent text-sm font-normal"
                >
                  + Columna
                </button>
                {addColOpen && (
                  <div className="absolute left-0 top-full mt-1 z-20 bg-dark-card border border-dark-border rounded-monday shadow-xl py-1 min-w-[160px]">
                    {COLUMN_TYPES.map((c) => (
                      <button
                        key={c.type}
                        type="button"
                        disabled={addingCol}
                        onClick={() => handleAddColumn(c.type)}
                        className="w-full text-left px-3 py-2 hover:bg-dark-hover text-sm text-white"
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
                <tr className="bg-dark-hover/50">
                  <td
                    colSpan={displayColumns.length + 2}
                    className="py-2 px-4 border-b border-dark-border font-medium text-white"
                  >
                    {grp.title}
                  </td>
                </tr>
              )}
              {(grp.items || []).map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-dark-border hover:bg-dark-hover/30 transition-colors"
                >
                  <td className="py-1 px-4 border-r border-dark-border align-top min-w-[200px]">
                    <input
                      type="text"
                      defaultValue={item.name}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v !== item.name) handleUpdateItemName(item.id, v || (directorio ? 'Sin nombre' : 'Sin título'));
                      }}
                      className="w-full bg-transparent text-white border-none outline-none py-2 rounded px-1 hover:bg-dark-card focus:bg-dark-card focus:ring-1 ring-accent"
                      placeholder={directorio ? 'Nombre del cliente' : undefined}
                    />
                  </td>
                  {displayColumns.map((col) => (
                    <td
                      key={col.virtual ? col.key : col.id}
                      className="py-1 px-3 border-r border-dark-border align-top last:border-r-0 min-w-[120px]"
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
                          <CellAsignadoA
                            item={item}
                            users={users}
                            onUpdate={(data) => handleUpdateItemField(item.id, data)}
                          />
                        ) : col.key === VIRTUAL_KEYS.TIEMPO_PRODUCCION ? (
                          <CellTiempoProduccion
                            item={item}
                            onUpdate={(data) => handleUpdateItemField(item.id, data)}
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
                  {!directorio && <td className="py-1 px-2 align-top" />}
                </tr>
              ))}
              {(grp.items || []).length === 0 && directorio && tableVariant === 'taller' ? (
                <tr>
                  <td colSpan={displayColumns.length + 1} className="py-4 px-4 border-b border-dark-border text-center text-gray-500 text-sm">
                    Ningún proyecto con Estatus APROBADO en este grupo.
                  </td>
                </tr>
              ) : null}
              <tr>
                <td colSpan={displayColumns.length + (directorio ? 1 : 2)} className="py-2 px-4 border-b border-dark-border">
                  <button
                    type="button"
                    onClick={() => handleAddItem(grp.id)}
                    disabled={addingItem === grp.id}
                    className="text-gray-500 hover:text-accent text-sm"
                  >
                    + {directorio ? 'Añadir proyecto' : 'Añadir elemento'}
                  </button>
                </td>
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
        <div className="p-4 border-t border-dark-border flex gap-2">
          <input
            type="text"
            value={newGroupTitle}
            onChange={(e) => setNewGroupTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            placeholder="Nuevo grupo"
            className="flex-1 max-w-xs bg-dark-card border border-dark-border rounded-monday px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            type="button"
            onClick={handleAddGroup}
            disabled={addingGroup}
            className="px-4 py-2 rounded-monday bg-accent text-white font-medium hover:bg-accentHover disabled:opacity-50"
          >
            Añadir grupo
          </button>
        </div>
      )}
    </div>
  );
}
