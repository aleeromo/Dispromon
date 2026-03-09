import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/authMiddleware.js';
import authRoutes from './routes/auth.js';
import workspaceRoutes from './routes/workspaces.js';
import boardRoutes from './routes/boards.js';
import folderRoutes from './routes/folders.js';
import groupRoutes from './routes/groups.js';
import itemRoutes from './routes/items.js';
import columnRoutes from './routes/columns.js';
import valuesRoutes from './routes/values.js';
import uploadRoutes from './routes/upload.js';
import usersRoutes from './routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT_WANTED = parseInt(process.env.PORT, 10) || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);

app.use('/api/workspaces', authMiddleware, workspaceRoutes);
app.use('/api/boards', authMiddleware, boardRoutes);
app.use('/api/folders', authMiddleware, folderRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/items', authMiddleware, itemRoutes);
app.use('/api/columns', authMiddleware, columnRoutes);
app.use('/api/values', authMiddleware, valuesRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/users', authMiddleware, usersRoutes);

function start(port) {
  const server = app.listen(port, () => {
    console.log(`Backend en http://localhost:${port}`);
    if (port !== PORT_WANTED) {
      console.log(`(Puerto ${PORT_WANTED} estaba ocupado. Crea frontend/.env con: VITE_API_PORT=${port})`);
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const next = port + 1;
      if (next <= 3010) {
        console.warn(`Puerto ${port} en uso, probando ${next}...`);
        start(next);
      } else {
        console.error('No hay puertos libres entre 3001 y 3010. Libera uno o define PORT.');
        process.exit(1);
      }
    } else {
      throw err;
    }
  });
}
start(PORT_WANTED);
