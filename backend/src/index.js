// src/index.js — FINEVSIS Backend Entry Point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import usersRouter from './routes/users.js';
import trendsRouter from './routes/trends.js';
import problemsRouter from './routes/problems.js';
import opportunitiesRouter from './routes/opportunities.js';
import projectsRouter from './routes/projects.js';
import analysisRouter from './routes/analysis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './services/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Segurança & Middlewares ─────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Rate limit global
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests' }));

// ── Health Check ────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Rotas da API ────────────────────────────────────
app.use('/api/users',         usersRouter);
app.use('/api/trends',        trendsRouter);
app.use('/api/problems',      problemsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/projects',      projectsRouter);
app.use('/api/analysis',      analysisRouter);

// ── Error Handler ───────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 FINEVSIS Backend running on http://localhost:${PORT}`);
});

export default app;
