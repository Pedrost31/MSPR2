"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeeklyActivitySummary = exports.deleteActivity = exports.updateActivity = exports.getActivityById = exports.getActivities = exports.createActivity = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middlewares/error.middleware");
const createActivity = async (userId, input) => database_1.prisma.activityEntry.create({
    data: {
        ...input,
        userId,
        type: input.type ?? 'other',
        date: input.date ? new Date(input.date) : new Date(),
    },
});
exports.createActivity = createActivity;
const getActivities = async (userId, filters) => {
    const { startDate, endDate, type, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    const where = {
        userId,
        ...(startDate || endDate
            ? { date: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
            : {}),
        ...(type ? { type: type } : {}),
    };
    const [entries, total] = await Promise.all([
        database_1.prisma.activityEntry.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
        database_1.prisma.activityEntry.count({ where }),
    ]);
    return { entries, total, page, limit, pages: Math.ceil(total / limit) };
};
exports.getActivities = getActivities;
const getActivityById = async (id, userId) => {
    const entry = await database_1.prisma.activityEntry.findFirst({ where: { id, userId } });
    if (!entry)
        throw new error_middleware_1.AppError('Activité introuvable', 404);
    return entry;
};
exports.getActivityById = getActivityById;
const updateActivity = async (id, userId, input) => {
    const existing = await database_1.prisma.activityEntry.findFirst({ where: { id, userId } });
    if (!existing)
        throw new error_middleware_1.AppError('Activité introuvable', 404);
    return database_1.prisma.activityEntry.update({
        where: { id },
        data: { ...input, ...(input.date ? { date: new Date(input.date) } : {}) },
    });
};
exports.updateActivity = updateActivity;
const deleteActivity = async (id, userId) => {
    const existing = await database_1.prisma.activityEntry.findFirst({ where: { id, userId } });
    if (!existing)
        throw new error_middleware_1.AppError('Activité introuvable', 404);
    await database_1.prisma.activityEntry.delete({ where: { id } });
};
exports.deleteActivity = deleteActivity;
const getWeeklyActivitySummary = async (userId) => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const activities = await database_1.prisma.activityEntry.findMany({
        where: { userId, date: { gte: start } },
        orderBy: { date: 'asc' },
    });
    return {
        weekStart: start.toISOString(),
        totalCaloriesBurned: activities.reduce((s, a) => s + a.caloriesBurned, 0),
        totalDurationMinutes: activities.reduce((s, a) => s + a.duration, 0),
        sessionCount: activities.length,
        activities,
    };
};
exports.getWeeklyActivitySummary = getWeeklyActivitySummary;
//# sourceMappingURL=activity.service.js.map