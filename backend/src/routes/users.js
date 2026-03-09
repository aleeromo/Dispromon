import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/users
 * Solo ADMIN. Lista usuarios (id, nombre, rol; sin password).
 */
router.get('/', authMiddleware, requireRole('ADMIN'), async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nombre: true, rol: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

/**
 * GET /api/users/profiles
 * Cualquier usuario autenticado. Lista perfiles (id, nombre) para asignación en proyectos.
 */
router.get('/profiles', authMiddleware, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar perfiles' });
  }
});

export default router;
