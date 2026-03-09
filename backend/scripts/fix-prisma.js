/**
 * Solución para EPERM en Windows al ejecutar prisma generate.
 * Ejecutar desde backend: node scripts/fix-prisma.js
 */
import { rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prismaDir = join(__dirname, '../node_modules/.prisma');

if (existsSync(prismaDir)) {
  console.log('Eliminando node_modules/.prisma...');
  rmSync(prismaDir, { recursive: true, force: true });
  console.log('Hecho. Ejecutando prisma generate...');
}
execSync('npx prisma generate', {
  cwd: join(__dirname, '..'),
  stdio: 'inherit',
});
