import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getCurrentMesRegistro, mesRegistroToDisplay } from '../services/folderService.js';

const prisma = new PrismaClient();
const router = Router();

// Directorio de Producción (sin Cotización; Estatus Ventas/Taller; Tiempo de Producción en Item)
const LEVANTAMIENTO_OPTIONS = [
  { id: 'pendiente', label: 'Pendiente', color: '#a0a0a0' },
  { id: 'programado', label: 'Programado', color: '#fdab3d' },
  { id: 'realizado', label: 'Realizado', color: '#00c875' },
];
const ESTATUS_VENTAS_OPTIONS = [
  { id: 'cotizando', label: 'Cotizando', color: '#9ca3af' },
  { id: 'cotizacion_enviada', label: 'Cotización enviada', color: '#3b82f6' },
  { id: 'aprobado', label: 'APROBADO', color: '#22c55e' },
];
const ESTATUS_TALLER_OPTIONS = [
  { id: 'pendiente', label: 'Pendiente', color: '#a0a0a0' },
  { id: 'en_produccion', label: 'En Producción', color: '#fdab3d' },
  { id: 'terminado', label: 'Terminado', color: '#00c875' },
];
const COBRO_OPTIONS = [
  { id: 'anticipo', label: 'Anticipo', color: '#579bfc' },
  { id: 'liquidado', label: 'Liquidado', color: '#00c875' },
  { id: 'facturado', label: 'Facturado', color: '#401694' },
];

// Estatus Ventas/Taller y Tiempo de Producción se guardan en Item (no en columnas)
const PRODUCTION_COLUMNS = [
  { title: 'Folio', type: 'text', position: 0 },
  { title: 'Levantamiento', type: 'status', position: 1, settings: { options: LEVANTAMIENTO_OPTIONS } },
  { title: 'Link de Drive', type: 'drive_link', position: 2 },
  { title: 'Hoja de Trabajo', type: 'hoja_trabajo', position: 3 },
  { title: 'Cobro', type: 'status', position: 4, settings: { options: COBRO_OPTIONS } },
];

function createBoardWithColumns(workspaceId, options = {}) {
  const { mes_registro, folderId, folderName } = options;
  const name = folderName || (mes_registro ? mesRegistroToDisplay(mes_registro) : 'Sin nombre');
  return prisma.board.create({
    data: {
      name,
      mes_registro: mes_registro || null,
      workspaceId,
      folderId: folderId || null,
      nextFolioNumber: 1,
    },
  }).then((board) => {
    return Promise.all([
      ...PRODUCTION_COLUMNS.map((col) =>
        prisma.column.create({
          data: {
            boardId: board.id,
            title: col.title,
            type: col.type,
            position: col.position,
            settings: col.settings ? JSON.stringify(col.settings) : null,
          },
        })
      ),
      prisma.group.create({
        data: { boardId: board.id, title: 'Proyectos', position: 0 },
      }),
    ]).then(() =>
      prisma.board.findUnique({
        where: { id: board.id },
        include: { workspace: true, groups: true, columns: { orderBy: { position: 'asc' } } },
      })
    );
  });
}

router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const where = workspaceId ? { workspaceId } : {};
    const boards = await prisma.board.findMany({
      where,
      include: { groups: { include: { items: { include: { values: true } } } }, columns: true },
      orderBy: [{ mes_registro: 'desc' }, { id: 'asc' }],
    });
    res.json(boards);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/boards/ensure-month?workspaceId=xxx&mes_registro=2026-03
 * Devuelve el board del mes (creado si no existe).
 */
router.get('/ensure-month', async (req, res) => {
  try {
    const { workspaceId, mes_registro } = req.query;
    if (!workspaceId || !mes_registro || !/^\d{4}-\d{2}$/.test(mes_registro)) {
      return res.status(400).json({ error: 'workspaceId y mes_registro (YYYY-MM) requeridos' });
    }
    let board = await prisma.board.findFirst({
      where: { workspaceId, mes_registro },
      include: fullBoardInclude(),
    });
    if (!board) {
      board = await createBoardWithColumns(workspaceId, { mes_registro });
      board = await prisma.board.findUnique({
        where: { id: board.id },
        include: fullBoardInclude(),
      });
    }
    res.json(board);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

function fullBoardInclude() {
  return {
    workspace: true,
    folder: true,
    groups: {
      orderBy: { position: 'asc' },
      include: {
        items: {
          orderBy: { position: 'asc' },
          include: { values: true, asignado_a: true },
        },
      },
    },
    columns: { orderBy: { position: 'asc' } },
  };
}

/** GET /api/boards/ensure-folder?workspaceId=xxx&folderId=xxx */
router.get('/ensure-folder', async (req, res) => {
  try {
    const { workspaceId, folderId } = req.query;
    if (!workspaceId || !folderId) return res.status(400).json({ error: 'workspaceId y folderId requeridos' });
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, workspaceId },
    });
    if (!folder) return res.status(404).json({ error: 'Carpeta no encontrada' });
    let board = await prisma.board.findFirst({
      where: { folderId },
      include: fullBoardInclude(),
    });
    if (!board) {
      board = await createBoardWithColumns(workspaceId, { folderId, folderName: folder.name });
      board = await prisma.board.findUnique({
        where: { id: board.id },
        include: fullBoardInclude(),
      });
    }
    res.json(board);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: fullBoardInclude(),
    });
    if (!board) return res.status(404).json({ error: 'Board no encontrado' });
    res.json(board);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { workspaceId, mes_registro: mesRegistroBody, folderId, folderName } = req.body;
    const mes_registro = mesRegistroBody || getCurrentMesRegistro();
    const board = await createBoardWithColumns(workspaceId, { mes_registro, folderId, folderName });
    res.status(201).json(board);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name, mes_registro, folderId } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (mes_registro !== undefined) data.mes_registro = mes_registro;
    if (folderId !== undefined) data.folderId = folderId;
    const board = await prisma.board.update({
      where: { id: req.params.id },
      data,
    });
    res.json(board);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.board.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
