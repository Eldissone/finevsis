// src/middleware/errorHandler.js
import { logger } from '../services/logger.js';

export function errorHandler(err, req, res, _next) {
  logger.error({ message: err.message, stack: err.stack, path: req.path });

  if (err.code === 'P2025') return res.status(404).json({ error: 'Recurso não encontrado' });
  if (err.code === 'P2002') return res.status(409).json({ error: 'Registo duplicado' });

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor' });
}
