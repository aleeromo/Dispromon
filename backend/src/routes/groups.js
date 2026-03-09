import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { boardId } = req.query;
    const groups = await prisma.group.findMany({
      where: { boardId },
      include: { items: { include: { values: true } } },
      orderBy: { position: 'asc' },
    });
    res.json(groups);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { boardId, title } = req.body;
    const count = await prisma.group.count({ where: { boardId } });
    const group = await prisma.group.create({
      data: {
        boardId,
        title: title || 'Nuevo grupo',
        position: count,
      },
    });
    res.json(group);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { title, position } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (position !== undefined) data.position = position;
    const group = await prisma.group.update({
      where: { id: req.params.id },
      data,
    });
    res.json(group);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.group.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
