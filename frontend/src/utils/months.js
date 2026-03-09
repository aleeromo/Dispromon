const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Genera mes_registro (YYYY-MM) para un desplazamiento desde la fecha actual
 */
function getMesRegistroForOffset(offsetMonths) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Mes actual en formato YYYY-MM */
export function getCurrentMesRegistro() {
  return getMesRegistroForOffset(0);
}

/**
 * Lista de mes_registro: desde hace 12 meses hasta dentro de 3 meses (orden: más reciente primero)
 */
export function getMesRegistroList() {
  const list = [];
  for (let i = 3; i >= -12; i--) {
    list.push(getMesRegistroForOffset(i));
  }
  return list;
}

/**
 * Formato legible: 2026-03 -> "Marzo 2026"
 */
export function mesRegistroToDisplay(mesRegistro) {
  if (!mesRegistro || !/^\d{4}-\d{2}$/.test(mesRegistro)) return mesRegistro || '';
  const [y, m] = mesRegistro.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
}
