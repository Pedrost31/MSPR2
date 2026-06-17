"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const generateAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => jsonwebtoken_1.default.sign({ ...payload, jti: crypto_1.default.randomUUID() }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN });
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=jwt.utils.js.map