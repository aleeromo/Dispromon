import { useState, useMemo } from 'react';
import {
  format,
  parseISO,
  startOfDay,
  endOfMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  addDays,
  getDaysInMonth,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';

function getValue(item, columnId) {
  const v = item.values?.find((x) => x.columnId === columnId);
  if (!v || v.value == null) return null;
  try {
    return JSON.parse(v.value);
  } catch {
    return null;
  }
}

const DAY_WIDTH = 32;
const ROW_HEIGHT = 44;
const WEEK_STARTS_ON = 1; // Lunes

export default function BoardTimeline({ board, directorio }) {
  const timelineCol = (board.columns || []).find((c) => c.type === 'timeline');
  const fechaColocacionCol = (board.columns || []).find(
    (c) => c.type === 'date' && (c.title === 'Fecha de Colocación' || c.title === 'Fecha de colocación')
  );
  const dateCol = directorio ? fechaColocacionCol : null;

  const [displayMonth, setDisplayMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const folioCol = (board.columns || []).find((c) => c.title === 'Folio');
  function getFolio(item) {
    if (!folioCol) return '';
    const v = item.values?.find((x) => x.columnId === folioCol.id);
    if (!v?.value) return '';
    try {
      const parsed = JSON.parse(v.value);
      return parsed?.text ?? (typeof parsed === 'string' ? parsed : '') ?? '';
    } catch {
      return '';
    }
  }

  const itemsWithRange = useMemo(() => {
    const list = [];
    (board.groups || []).forEach((grp) => {
      (grp.items || []).forEach((item) => {
        if (directorio && (item.fecha_inicio_produccion || item.fecha_fin_produccion)) {
          if (item.estatus_taller !== 'en_produccion') return;
          const startStr = item.fecha_inicio_produccion;
          const endStr = item.fecha_fin_produccion || item.fecha_inicio_produccion;
          try {
            const start = startOfDay(parseISO(startStr));
            const end = startOfDay(parseISO(endStr));
            list.push({ ...item, groupTitle: grp.title, start, end });
          } catch {
            //
          }
          return;
        }
        if (dateCol) {
          const val = getValue(item, dateCol.id);
          const dateStr = val?.date;
          if (!dateStr) return;
          try {
            const d = startOfDay(parseISO(dateStr));
            list.push({ ...item, groupTitle: grp.title, start: d, end: d });
          } catch {
            //
          }
          return;
        }
        const val = timelineCol ? getValue(item, timelineCol.id) : null;
        const start = val?.start ? parseISO(val.start) : null;
        const end = val?.end ? parseISO(val.end) : null;
        list.push({
          ...item,
          groupTitle: grp.title,
          start,
          end,
        });
      });
    });
    return list.filter((i) => i.start && i.end);
  }, [board.groups, timelineCol, dateCol, directorio]);

  const { minDate, maxDate, days, calendarWeeks } = useMemo(() => {
    if (directorio) {
      const { year, month } = displayMonth;
      const monthStart = startOfMonth(new Date(year, month, 1));
      const monthEnd = endOfMonth(monthStart);
      const calStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });
      const weeks = [];
      let d = calStart;
      while (d <= calEnd) {
        const week = [];
        for (let i = 0; i < 7; i++) {
          week.push(d);
          d = addDays(d, 1);
        }
        weeks.push(week);
      }
      return {
        minDate: monthStart,
        maxDate: monthEnd,
        days: getDaysInMonth(monthStart),
        calendarWeeks: weeks,
      };
    }
    if (itemsWithRange.length === 0) {
      const today = startOfDay(new Date());
      return {
        minDate: addDays(today, -7),
        maxDate: addDays(today, 30),
        days: 38,
        calendarWeeks: null,
      };
    }
    let min = null;
    let max = null;
    itemsWithRange.forEach(({ start, end }) => {
      if (!min || start < min) min = start;
      if (!max || end > max) max = end;
    });
    min = addDays(startOfDay(min), -3);
    max = addDays(startOfDay(max), 10);
    const daysCount = differenceInDays(max, min) + 1;
    return { minDate: min, maxDate: max, days: daysCount, calendarWeeks: null };
  }, [itemsWithRange, directorio, displayMonth]);

  const itemsInMonth = useMemo(() => {
    if (!directorio || !minDate || !maxDate) return itemsWithRange;
    return itemsWithRange.filter((i) => i.start <= maxDate && i.end >= minDate);
  }, [directorio, itemsWithRange, minDate, maxDate]);

  const itemsByDay = useMemo(() => {
    const map = new Map();
    itemsInMonth.forEach((item) => {
      let d = startOfDay(item.start);
      const end = startOfDay(item.end);
      while (d <= end) {
        const key = format(d, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        if (!map.get(key).some((i) => i.id === item.id)) map.get(key).push(item);
        d = addDays(d, 1);
      }
    });
    return map;
  }, [itemsInMonth]);

  const dayLabels = useMemo(() => {
    if (directorio && calendarWeeks?.length) return calendarWeeks.flat();
    const arr = [];
    for (let i = 0; i < days; i++) {
      arr.push(addDays(minDate, i));
    }
    return arr;
  }, [minDate, days, directorio, calendarWeeks]);

  if (!timelineCol && !dateCol && !directorio) {
    return (
      <div className="p-8 text-gray-400">
        Este board no tiene columna Cronograma ni Fecha de Colocación. Usa la vista Tabla para configurarlas.
      </div>
    );
  }

  // Vista tipo Google: tabla mes con filas = semanas, columnas = días de la semana
  if (directorio && calendarWeeks?.length) {
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return (
      <div className="flex flex-col h-full min-h-0 p-4">
        <div className="shrink-0 flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() =>
              setDisplayMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { year: m.year, month: m.month - 1 }))
            }
            className="px-3 py-1.5 rounded-monday bg-dark-card border border-dark-border text-gray-300 hover:bg-dark-hover text-sm"
          >
            ←
          </button>
          <span className="text-white font-medium capitalize min-w-[180px] text-center">
            {format(new Date(displayMonth.year, displayMonth.month, 1), 'MMMM yyyy', { locale: es })}
          </span>
          <button
            type="button"
            onClick={() =>
              setDisplayMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { year: m.year, month: m.month + 1 }))
            }
            className="px-3 py-1.5 rounded-monday bg-dark-card border border-dark-border text-gray-300 hover:bg-dark-hover text-sm"
          >
            →
          </button>
        </div>
        <div className="flex-1 min-h-[400px] flex flex-col rounded-monday overflow-hidden">
          <div className="flex-1 min-h-0 bg-dark-card border border-dark-border rounded-monday overflow-auto">
          <table className="w-full border-collapse min-h-full" style={{ tableLayout: 'fixed', minHeight: 'min(60vh, 500px)' }}>
            <thead>
              <tr className="border-b border-dark-border">
                {dayNames.map((name) => (
                  <th
                    key={name}
                    className="py-2 px-1 text-center text-xs font-medium text-gray-400 border-r border-dark-border last:border-r-0"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calendarWeeks.map((week, wi) => (
                <tr key={wi} className="border-b border-dark-border last:border-b-0">
                  {week.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const items = itemsByDay.get(key) || [];
                    const isCurrentMonth = isSameMonth(day, minDate);
                    const isToday = isSameDay(day, new Date());
                    return (
                      <td
                        key={key}
                        className="align-top border-r border-dark-border last:border-r-0 p-1 min-h-[100px] bg-dark-bg/30"
                      >
                        <div className="text-right text-sm mb-1">
                          {isToday && isCurrentMonth ? (
                            <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-accent text-white ml-auto">
                              {format(day, 'd')}
                            </span>
                          ) : (
                            <span className={!isCurrentMonth ? 'text-gray-600' : 'text-gray-400'}>
                              {format(day, 'd')}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {items.map((item) => {
                            const folio = directorio ? getFolio(item) : '';
                            const label = directorio && folio ? `${item.name || 'Sin nombre'} · ${folio}` : (item.name || 'Sin título');
                            return (
                              <div
                                key={item.id}
                                className="text-xs px-2 py-1 rounded bg-accent/90 text-white truncate cursor-default"
                                title={label}
                              >
                                {label}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        {itemsInMonth.length === 0 && (
          <p className="shrink-0 text-gray-500 text-sm mt-2 text-center">
            Sin proyectos con Tiempo de Producción en este mes. Asigna fechas en la vista Taller.
          </p>
        )}
      </div>
    );
  }

  // Vista horizontal (no directorio o fallback)
  return (
    <div className="h-full overflow-auto p-4">
      <div className="inline-flex flex-col min-w-max">
        <div className="flex border-b border-dark-border sticky top-0 bg-dark-bg z-10">
          <div className="w-64 shrink-0 py-3 px-4 font-medium text-gray-400 border-r border-dark-border">
            {directorio ? 'Proyecto' : 'Tarea'}
          </div>
          <div className="flex" style={{ width: days * DAY_WIDTH }}>
            {dayLabels.map((d) => (
              <div
                key={d.getTime()}
                className="shrink-0 py-2 px-1 text-center text-xs text-gray-500 border-r border-dark-border"
                style={{ width: DAY_WIDTH }}
              >
                {format(d, 'd')}
                <div className="text-gray-600">{format(d, 'EEE', { locale: es })}</div>
              </div>
            ))}
          </div>
        </div>
        {(directorio ? itemsInMonth : itemsWithRange).length === 0 ? (
          <div className="flex py-8 text-gray-500">
            <div className="w-64 px-4">
              {directorio ? 'Sin proyectos con fecha de colocación en este mes' : 'Sin tareas con cronograma'}
            </div>
            <div className="text-sm">
              {directorio ? 'Asigna Fecha de Colocación en la vista Tabla o cambia de mes.' : 'Edita la columna Cronograma en la vista Tabla.'}
            </div>
          </div>
        ) : (
          (directorio ? itemsInMonth : itemsWithRange).map((item) => {
            const start = startOfDay(item.start);
            const end = startOfDay(item.end);
            const left = differenceInDays(start, minDate) * DAY_WIDTH;
            const width = Math.max(DAY_WIDTH, (differenceInDays(end, start) + 1) * DAY_WIDTH);
            const folio = directorio ? getFolio(item) : '';
            const rowLabel = directorio && folio ? `${item.name || 'Sin nombre'} · ${folio}` : (item.name || 'Sin título');
            return (
              <div
                key={item.id}
                className="flex border-b border-dark-border hover:bg-dark-hover/30"
                style={{ height: ROW_HEIGHT }}
              >
                <div className="w-64 shrink-0 py-2 px-4 border-r border-dark-border flex items-center truncate text-white text-sm">
                  {rowLabel}
                </div>
                <div className="relative flex items-center" style={{ width: days * DAY_WIDTH, height: ROW_HEIGHT }}>
                  <div
                    className="absolute rounded-monday h-6 flex items-center px-2 text-xs font-medium text-white overflow-hidden"
                    style={{
                      left: left + 4,
                      width: width - 8,
                      backgroundColor: '#0073EA',
                    }}
                    title={`${rowLabel} — ${format(item.start, 'd MMM yyyy', { locale: es })} - ${format(item.end, 'd MMM yyyy', { locale: es })}`}
                  >
                    {format(item.start, 'd MMM', { locale: es })} - {format(item.end, 'd MMM', { locale: es })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
