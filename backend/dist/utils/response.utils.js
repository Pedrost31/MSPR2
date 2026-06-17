"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, statusCode = 200, message) => {
    const body = { success: true, data, ...(message ? { message } : {}) };
    return res.status(statusCode).json(body);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message, statusCode = 400, errors) => {
    const body = { success: false, message, ...(errors ? { errors } : {}) };
    return res.status(statusCode).json(body);
};
exports.sendError = sendError;
//# sourceMappingURL=response.utils.js.map