import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PATH = path.join(__dirname, '../prisma/dev.db');
const BACKUPS_DIR = path.join(__dirname, '../backups');

export function runBackup() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      console.log('[Backup] No se encontró dev.db para respaldar.');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUPS_DIR, `dev-${timestamp}.db`);

    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[Backup] Respaldo de base de datos exitoso: ${backupPath}`);
  } catch (error) {
    console.error('[Backup] Error durante el respaldo:', error);
  }
}

// Permitir ejecución manual si se llama el script directamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup();
}
