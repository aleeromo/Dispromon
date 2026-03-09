import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();

router.put('/', async (req, res) => {
  try {
    const { itemId, columnId, value } = req.body;
    const val = await prisma.itemValue.upsert({
      where: {
        itemId_columnId: { itemId, columnId },
      },
      create: { itemId, columnId, value: value != null ? JSON.stringify(value) : null },
      update: { value: value != null ? JSON.stringify(value) : null },
    });
    res.json(val);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
