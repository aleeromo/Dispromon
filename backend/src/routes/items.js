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
      include: { values: true, usersAssigned: true, updates: { include: { user: true } } },
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
      if (col.title === 'Folio') value = JSON.stringify({ text: '' });
      if (col.type === 'hoja_trabajo') value = JSON.stringify({});
      await prisma.itemValue.create({
        data: {
          itemId: item.id,
          columnId: col.id,
          value,
        },
      });
    }

    const mesRegistro = board.mes_registro || getCurrentMesRegistro();
    createProjectFolder({
      mesRegistro,
      clienteName: item.name,
      folio: '', // Folio manual: el usuario lo escribe en la tabla
    });

    const full = await prisma.item.findUnique({
      where: { id: item.id },
      include: { values: true, usersAssigned: true, updates: { include: { user: true } } },
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
      usersAssignedIds, dateRangeStart, dateRangeEnd, estatus_ventas, estatus_taller, fecha_inicio_produccion, fecha_fin_produccion, ruta_archivo,
    } = req.body;
    
    // We need the old item to detect changes for Tasks and AuditLogs
    const oldItem = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!oldItem) return res.status(404).json({ error: 'Item no encontrado' });

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (materials !== undefined) data.materials = materials;
    if (finalMeasures !== undefined) data.finalMeasures = finalMeasures;
    if (position !== undefined) data.position = position;
    if (groupId !== undefined) data.groupId = groupId;
    if (dateRangeStart !== undefined) data.dateRangeStart = dateRangeStart ? new Date(dateRangeStart) : null;
    if (dateRangeEnd !== undefined) data.dateRangeEnd = dateRangeEnd ? new Date(dateRangeEnd) : null;
    if (estatus_ventas !== undefined) data.estatus_ventas = estatus_ventas || null;
    if (estatus_taller !== undefined) data.estatus_taller = estatus_taller || null;
    if (fecha_inicio_produccion !== undefined) data.fecha_inicio_produccion = fecha_inicio_produccion ? new Date(fecha_inicio_produccion) : null;
    if (fecha_fin_produccion !== undefined) data.fecha_fin_produccion = fecha_fin_produccion ? new Date(fecha_fin_produccion) : null;
    if (ruta_archivo !== undefined) data.ruta_archivo = ruta_archivo;

    if (usersAssignedIds !== undefined && Array.isArray(usersAssignedIds)) {
      data.usersAssigned = {
        set: usersAssignedIds.map(id => ({ id }))
      };
    }

    const item = await prisma.item.update({
      where: { id: req.params.id },
      data,
      include: { usersAssigned: true, updates: { include: { user: true } } },
    });

    const currentUserId = req.user?.id; // Assuming authMiddleware sets req.user

    // 1. Audit Logs for Status Changes
    if (estatus_ventas !== undefined && oldItem.estatus_ventas !== estatus_ventas) {
      await prisma.auditLog.create({
        data: {
          action: 'CAMBIO_ESTATUS_VENTAS',
          entity: 'ITEM',
          entityId: item.id,
          details: JSON.stringify({ oldStatus: oldItem.estatus_ventas, newStatus: estatus_ventas }),
          userId: currentUserId,
        }
      });
    }

    if (estatus_taller !== undefined && oldItem.estatus_taller !== estatus_taller) {
      await prisma.auditLog.create({
        data: {
          action: 'CAMBIO_ESTATUS_TALLER',
          entity: 'ITEM',
          entityId: item.id,
          details: JSON.stringify({ oldStatus: oldItem.estatus_taller, newStatus: estatus_taller }),
          userId: currentUserId,
        }
      });
    }

    // Removed single user assignments auditing and tasks generation as we moved to a multiple assignments strategy

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
