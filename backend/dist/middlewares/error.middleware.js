"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.AppError = void 0;
const zod_1 = require("zod");
const response_utils_1 = require("../utils/response.utils");
class AppError extends Error {
    constructor(message, statusCode = 400, errors) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorMiddleware = (err, _req, res, _next) => {
    if (err instanceof zod_1.ZodError) {
        const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        (0, response_utils_1.sendError)(res, 'Validation error', 422, errors);
        return;
    }
    if (err instanceof AppError) {
        (0, response_utils_1.sendError)(res, err.message, err.statusCode, err.errors);
        return;
    }
    console.error('[Error]', err);
    (0, response_utils_1.sendError)(res, 'Internal server error', 500);
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map