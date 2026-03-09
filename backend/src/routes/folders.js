import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { workspaceId, parentId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId requerido' });
    const where = { workspaceId };
    if (parentId !== undefined) where.parentId = parentId === '' ? null : parentId;
    const folders = await prisma.folder.findMany({
      where,
      orderBy: { position: 'asc' },
      include: { _count: { select: { children: true } } },
    });
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: req.params.id },
      include: {
        parent: true,
        _count: { select: { children: true } },
        workspace: true,
      },
    });
    if (!folder) return res.status(404).json({ error: 'Carpeta no encontrada' });
    res.json(folder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { workspaceId, name } = req.body;
    const parentId = req.body.parentId ?? req.body.parentID ?? null;
    if (!workspaceId || !name?.trim()) {
      return res.status(400).json({ error: 'workspaceId y name requeridos' });
    }
    const pid = parentId === undefined || parentId === '' ? null : String(parentId).trim() || null;

    if (pid) {
      const parent = await prisma.folder.findUnique({
        where: { id: pid },
        select: { id: true, workspaceId: true },
      });
      if (!parent) {
        return res.status(400).json({ error: 'Carpeta padre no encontrada' });
      }
      if (parent.workspaceId !== workspaceId) {
        return res.status(400).json({ error: 'La carpeta padre no pertenece a este workspace' });
      }
    }

    const count = await prisma.folder.count({
      where: { workspaceId, parentId: pid },
    });
    const folder = await prisma.folder.create({
      data: {
        workspaceId,
        name: name.trim(),
        position: count,
        parentId: pid,
      },
    });
    res.status(201).json(folder);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Error al crear carpeta' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name, position } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (position !== undefined) data.position = position;
    const folder = await prisma.folder.update({
      where: { id: req.params.id },
      data,
    });
    res.json(folder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.folder.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
