import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { requestLogger } from './middlewares/logger.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { sendSuccess, sendError } from './utils/response.utils';
import apiRoutes from './routes';
import { swaggerSpec } from './docs/swagger';
import { env } from './config/env';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Trop de requêtes, veuillez réessayer plus tard' },
}));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'HealthAI Coach API',
  swaggerOptions: { persistAuthorization: true },
}));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => sendError(res, 'Route introuvable', 404));

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
