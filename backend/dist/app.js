"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const logger_middleware_1 = require("./middlewares/logger.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const response_utils_1 = require("./utils/response.utils");
const routes_1 = __importDefault(require("./routes"));
const swagger_1 = require("./docs/swagger");
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// ── Security ──────────────────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: env_1.env.CORS_ORIGIN, credentials: true }));
// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// ── Logging ───────────────────────────────────────────────────────────────────
app.use(logger_middleware_1.requestLogger);
// ── Global rate limit ─────────────────────────────────────────────────────────
app.use((0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Trop de requêtes, veuillez réessayer plus tard' },
}));
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    (0, response_utils_1.sendSuccess)(res, { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});
// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', routes_1.default);
// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customSiteTitle: 'HealthAI Coach API',
    swaggerOptions: { persistAuthorization: true },
}));
// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => (0, response_utils_1.sendError)(res, 'Route introuvable', 404));
// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
//# sourceMappingURL=app.js.map