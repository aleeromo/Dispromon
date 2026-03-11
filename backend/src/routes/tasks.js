import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET: Obtener tareas del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: { id: true, name: true }
        }
      }
    });
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH: Marcar tarea como leída
router.patch('/:id/read', async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE: Eliminar una tarea (opcional)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
