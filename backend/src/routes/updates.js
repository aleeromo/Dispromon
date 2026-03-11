import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { itemId } = req.query;
    if (!itemId) return res.status(400).json({ error: 'itemId is required' });

    const updates = await prisma.update.findMany({
      where: { itemId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(updates);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { body, itemId } = req.body;
    const userId = req.user?.id; // from authMiddleware
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!body || !itemId) return res.status(400).json({ error: 'body and itemId are required' });

    const update = await prisma.update.create({
      data: { body, itemId, userId },
      include: { user: true }
    });
    
    res.json(update);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const update = await prisma.update.findUnique({ where: { id: req.params.id } });
    if (!update) return res.status(404).json({ error: 'Update not found' });
    
    await prisma.update.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
