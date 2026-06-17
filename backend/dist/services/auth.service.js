"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshTokens = exports.login = exports.register = void 0;
const database_1 = require("../config/database");
const bcrypt_utils_1 = require("../utils/bcrypt.utils");
const jwt_utils_1 = require("../utils/jwt.utils");
const error_middleware_1 = require("../middlewares/error.middleware");
const USER_SELECT = {
    id: true, email: true, name: true, age: true, weight: true,
    height: true, gender: true, activityLevel: true, goal: true,
    dailyCalorieTarget: true, createdAt: true,
};
const refreshExpiresAt = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
};
const register = async (input) => {
    const existing = await database_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existing)
        throw new error_middleware_1.AppError('Email déjà utilisé', 409);
    const user = await database_1.prisma.user.create({
        data: { ...input, password: await (0, bcrypt_utils_1.hashPassword)(input.password) },
        select: USER_SELECT,
    });
    const accessToken = (0, jwt_utils_1.generateAccessToken)({ userId: user.id, email: user.email });
    const refreshToken = (0, jwt_utils_1.generateRefreshToken)({ userId: user.id, email: user.email });
    await database_1.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await database_1.prisma.refreshToken.create({
        data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt() },
    });
    return { user, accessToken, refreshToken };
};
exports.register = register;
const login = async (input) => {
    const user = await database_1.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await (0, bcrypt_utils_1.comparePassword)(input.password, user.password))) {
        throw new error_middleware_1.AppError('Email ou mot de passe incorrect', 401);
    }
    const accessToken = (0, jwt_utils_1.generateAccessToken)({ userId: user.id, email: user.email });
    const refreshToken = (0, jwt_utils_1.generateRefreshToken)({ userId: user.id, email: user.email });
    await database_1.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await database_1.prisma.refreshToken.create({
        data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt() },
    });
    const { password: _pw, ...safe } = user;
    return { user: safe, accessToken, refreshToken };
};
exports.login = login;
const refreshTokens = async (token) => {
    const payload = (0, jwt_utils_1.verifyRefreshToken)(token);
    const stored = await database_1.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
        throw new error_middleware_1.AppError('Token de rafraîchissement invalide ou expiré', 401);
    }
    await database_1.prisma.refreshToken.delete({ where: { token } });
    const accessToken = (0, jwt_utils_1.generateAccessToken)({ userId: payload.userId, email: payload.email });
    const newRefreshToken = (0, jwt_utils_1.generateRefreshToken)({ userId: payload.userId, email: payload.email });
    await database_1.prisma.refreshToken.create({
        data: { userId: payload.userId, token: newRefreshToken, expiresAt: refreshExpiresAt() },
    });
    return { accessToken, refreshToken: newRefreshToken };
};
exports.refreshTokens = refreshTokens;
const logout = async (token) => {
    await database_1.prisma.refreshToken.deleteMany({ where: { token } });
};
exports.logout = logout;
//# sourceMappingURL=auth.service.js.map