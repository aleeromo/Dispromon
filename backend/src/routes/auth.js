import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/login
 * Body: { username, password } (username = nombre de usuario único)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Nombre de usuario y contraseña requeridos' });
    }
    const nombreNorm = String(username).trim();
    const user = await prisma.user.findUnique({ where: { nombre: nombreNorm } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const token = jwt.sign(
      { userId: user.id, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error en el login' });
  }
});

/**
 * POST /api/auth/register
 * Solo ADMIN. Body: { nombre, password, rol } (nombre = nombre de usuario único, sin email)
 */
router.post('/register', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { nombre, password, rol } = req.body;
    if (!nombre || !password || !rol) {
      return res.status(400).json({ error: 'nombre, password y rol son requeridos' });
    }
    const allowedRoles = ['ADMIN', 'VENTAS', 'DISENO', 'TALLER'];
    if (!allowedRoles.includes(rol)) {
      return res.status(400).json({ error: 'rol debe ser ADMIN, VENTAS, DISENO o TALLER' });
    }
    const nombreNorm = String(nombre).trim();
    const existing = await prisma.user.findUnique({ where: { nombre: nombreNorm } });
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese nombre' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nombre: nombreNorm,
        password: hash,
        rol,
      },
    });
    res.status(201).json({
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

/**
 * GET /api/auth/me
 * Devuelve el usuario actual (requiere token).
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});

/**
 * GET /api/auth/login-names
 * Público. Devuelve solo los nombres de usuario para mostrar en el login (tarjetas).
 */
router.get('/login-names', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { nombre: true },
      orderBy: { nombre: 'asc' },
    });
    res.json({ names: users.map((u) => u.nombre) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar nombres' });
  }
});

export default router;
