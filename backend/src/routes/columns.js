import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { boardId } = req.query;
    const columns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });
    res.json(columns);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { boardId, title, type } = req.body;
    const count = await prisma.column.count({ where: { boardId } });
    const settings =
      type === 'status'
        ? JSON.stringify({
            options: [
              { id: 'done', label: 'Hecho', color: '#00c875' },
              { id: 'working', label: 'Trabajando', color: '#fdab3d' },
              { id: 'stuck', label: 'Estancado', color: '#e44258' },
            ],
          })
        : null;
    const column = await prisma.column.create({
      data: {
        boardId,
        title: title || 'Nueva columna',
        type: type || 'text',
        position: count,
        settings,
      },
    });
    res.json(column);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { title, type, position, settings } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (type !== undefined) data.type = type;
    if (position !== undefined) data.position = position;
    if (settings !== undefined) data.settings = typeof settings === 'string' ? settings : JSON.stringify(settings);
    const column = await prisma.column.update({
      where: { id: req.params.id },
      data,
    });
    res.json(column);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.column.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
