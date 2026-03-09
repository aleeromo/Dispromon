import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_PATH = process.env.PROJECTS_BASE_PATH || path.join(__dirname, '../../data/proyectos');

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Convierte YYYY-MM a nombre de mes (ej. 2026-03 -> "Marzo 2026")
 */
export function mesRegistroToDisplay(mesRegistro) {
  if (!mesRegistro || !/^\d{4}-\d{2}$/.test(mesRegistro)) return mesRegistro || '';
  const [y, m] = mesRegistro.split('-').map(Number);
  return `${MESES[m - 1]} ${y}`;
}

/**
 * Obtiene el mes actual en formato YYYY-MM
 */
export function getCurrentMesRegistro() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Nombre de carpeta seguro para Windows (sin caracteres prohibidos)
 */
function safeFolderName(name) {
  return String(name || '')
    .replace(/[<>:"/\\|?*]/g, '_')
    .trim() || 'sin_nombre';
}

/**
 * Crea la carpeta física: .../Mes/Cliente/Folio
 * @param {Object} opts - { mesRegistro, clienteName, folio }
 * @returns {string|null} ruta creada o null
 */
export function createProjectFolder(opts) {
  const { mesRegistro, clienteName, folio } = opts;
  const mesSafe = safeFolderName(mesRegistro);
  const clienteSafe = safeFolderName(clienteName);
  const folioSafe = safeFolderName(folio);
  const fullPath = path.join(BASE_PATH, mesSafe, clienteSafe, folioSafe);
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
  } catch (err) {
    console.error('[folderService] Error creando carpeta:', fullPath, err.message);
    return null;
  }
}
