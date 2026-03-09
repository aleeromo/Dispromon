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

/**
 * DELETE /api/users/:id
 * Solo ADMIN. Elimina un perfil de usuario. No se puede eliminar a uno mismo.
 */
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user?.id;
    if (currentUserId && userId === currentUserId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio perfil' });
    }
    await prisma.user.delete({
      where: { id: userId },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
