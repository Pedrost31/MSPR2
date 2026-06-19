"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middlewares/error.middleware");
const bcrypt_utils_1 = require("../utils/bcrypt.utils");
const USER_SELECT = {
    id: true, email: true, name: true, age: true, weight: true,
    height: true, gender: true, activityLevel: true, goal: true,
    dailyCalorieTarget: true, createdAt: true, updatedAt: true,
    goalSettings: true,
};
const getUserById = async (userId) => {
    const user = await database_1.prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
    if (!user)
        throw new error_middleware_1.AppError('Utilisateur introuvable', 404);
    return user;
};
exports.getUserById = getUserById;
const updateUser = async (userId, input) => {
    const data = { ...input };
    if (input.password) {
        data['password'] = await (0, bcrypt_utils_1.hashPassword)(input.password);
    }
    return database_1.prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true, email: true, name: true, age: true, weight: true,
            height: true, gender: true, activityLevel: true, goal: true,
            dailyCalorieTarget: true, updatedAt: true,
        },
    });
};
exports.updateUser = updateUser;
const deleteUser = async (userId) => {
    await database_1.prisma.user.delete({ where: { id: userId } });
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.service.js.map