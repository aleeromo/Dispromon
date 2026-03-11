import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const searchQuery = q.trim();

    // Buscar items cuyo nombre contenga la búsqueda (case-insensitive en SQLite no está soportado de forma nativa con sqlite-provider en findMany a menos que se use raw, 
    // pero Prisma 5 maneja un fallback interno u ofrece opciones. Para SQLite buscaremos directo).
    const items = await prisma.item.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery } },
          // También buscamos en los valores (ej. si el folio está gurdado en ItemValue)
          {
            values: {
              some: {
                value: { contains: searchQuery }
              }
            }
          }
        ]
      },
      include: {
        group: {
          include: {
            board: {
              include: { workspace: true }
            }
          }
        },
        values: {
          include: { column: true }
        }
      },
      take: 20 // Limitar resultados
    });

    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
