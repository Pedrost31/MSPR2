"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGoals = exports.getGoals = void 0;
const database_1 = require("../config/database");
const getGoals = async (userId) => {
    const goal = await database_1.prisma.goalSettings.findUnique({ where: { userId } });
    if (goal)
        return goal;
    return database_1.prisma.goalSettings.create({ data: { userId } });
};
exports.getGoals = getGoals;
const updateGoals = async (userId, input) => database_1.prisma.goalSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
});
exports.updateGoals = updateGoals;
//# sourceMappingURL=goal.service.js.map