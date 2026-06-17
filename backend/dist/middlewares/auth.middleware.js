"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_utils_1 = require("../utils/jwt.utils");
const response_utils_1 = require("../utils/response.utils");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
        (0, response_utils_1.sendError)(res, 'Unauthorized: missing token', 401);
        return;
    }
    const token = authHeader.slice(7);
    try {
        req.user = (0, jwt_utils_1.verifyAccessToken)(token);
        next();
    }
    catch {
        (0, response_utils_1.sendError)(res, 'Unauthorized: invalid or expired token', 401);
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map