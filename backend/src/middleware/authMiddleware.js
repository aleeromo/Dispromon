import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Valida el JWT en Authorization: Bearer <token> y adjunta el usuario en req.user.
 * Responde 401 si no hay token o es inválido.
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, nombre: true, rol: true },
    });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Opcional: exige que req.user.rol sea uno de los permitidos.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permiso para esta acción' });
    }
    next();
  };
}
