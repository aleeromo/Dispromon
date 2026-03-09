import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createProjectFolder, getCurrentMesRegistro } from '../services/folderService.js';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { groupId, boardId } = req.query;
    const where = groupId ? { groupId } : (boardId ? { group: { boardId } } : {});
    const items = await prisma.item.findMany({
      where,
      include: { values: true },
      orderBy: { position: 'asc' },
    });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { groupId, name } = req.body;
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { board: { include: { columns: { orderBy: { position: 'asc' } } } } },
    });
    if (!group) return res.status(400).json({ error: 'Grupo no encontrado' });

    const board = group.board;
    if (!board) return res.status(400).json({ error: 'Board no encontrado' });

    const count = await prisma.item.count({ where: { groupId } });
    const year = (board.mes_registro || getCurrentMesRegistro()).slice(0, 4);
    const num = board.nextFolioNumber;
    const folio = `OT-${year}-${String(num).padStart(3, '0')}`;

    const item = await prisma.item.create({
      data: {
        groupId,
        name: name || 'Sin nombre',
        position: count,
        estatus_taller: 'Pendiente',
      },
    });

    for (const col of board.columns) {
      let value = null;
      if (col.type === 'status') value = JSON.stringify({ optionId: null });
      if (col.title === 'Folio') value = JSON.stringify({ text: folio });
      if (col.type === 'hoja_trabajo') value = JSON.stringify({});
      await prisma.itemValue.create({
        data: {
          itemId: item.id,
          columnId: col.id,
          value,
        },
      });
    }

    await prisma.board.update({
      where: { id: board.id },
      data: { nextFolioNumber: board.nextFolioNumber + 1 },
    });

    const mesRegistro = board.mes_registro || getCurrentMesRegistro();
    createProjectFolder({
      mesRegistro,
      clienteName: item.name,
      folio,
    });

    const full = await prisma.item.findUnique({
      where: { id: item.id },
      include: { values: true, asignado_a: true },
    });
    res.json(full);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const {
      name, description, materials, finalMeasures, position, groupId,
      asignado_a_id, estatus_ventas, estatus_taller, fecha_inicio_produccion, fecha_fin_produccion,
    } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (materials !== undefined) data.materials = materials;
    if (finalMeasures !== undefined) data.finalMeasures = finalMeasures;
    if (position !== undefined) data.position = position;
    if (groupId !== undefined) data.groupId = groupId;
    if (asignado_a_id !== undefined) data.asignado_a_id = asignado_a_id || null;
    if (estatus_ventas !== undefined) data.estatus_ventas = estatus_ventas || null;
    if (estatus_taller !== undefined) data.estatus_taller = estatus_taller || null;
    if (fecha_inicio_produccion !== undefined) data.fecha_inicio_produccion = fecha_inicio_produccion ? new Date(fecha_inicio_produccion) : null;
    if (fecha_fin_produccion !== undefined) data.fecha_fin_produccion = fecha_fin_produccion ? new Date(fecha_fin_produccion) : null;
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data,
      include: { asignado_a: true },
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
