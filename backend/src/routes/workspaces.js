import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      include: { boards: true },
      orderBy: { id: 'asc' },
    });
    res.json(workspaces);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, categoria_raiz } = req.body;
    const cat = categoria_raiz === 'CLIENTE_GRANDE' ? 'CLIENTE_GRANDE' : 'PROYECTOS';
    const workspace = await prisma.workspace.create({
      data: { name: name || (cat === 'PROYECTOS' ? 'PROYECTOS' : 'Nuevo cliente'), categoria_raiz: cat },
    });
    res.json(workspace);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name, categoria_raiz } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (categoria_raiz !== undefined) data.categoria_raiz = categoria_raiz === 'CLIENTE_GRANDE' ? 'CLIENTE_GRANDE' : 'PROYECTOS';
    const workspace = await prisma.workspace.update({
      where: { id: req.params.id },
      data,
    });
    res.json(workspace);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.workspace.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
