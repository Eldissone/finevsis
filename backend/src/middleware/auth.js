import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { sanitizeUser } from '../services/authService.js';

function unauthorized(message = 'Autenticacao necessaria') {
  const error = new Error(message);
  error.status = 401;
  return error;
}

export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw unauthorized();
    }

    if (!process.env.JWT_SECRET) {
      const error = new Error('JWT_SECRET is not configured');
      error.status = 500;
      throw error;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!user) {
      throw unauthorized('Sessao invalida');
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    next(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
      ? unauthorized('Sessao invalida')
      : error);
  }
}
