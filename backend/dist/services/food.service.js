"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDailyNutritionSummary = exports.deleteFoodEntry = exports.updateFoodEntry = exports.getFoodEntryById = exports.getFoodEntries = exports.createFoodEntry = void 0;
const database_1 = require("../config/database");
const error_middleware_1 = require("../middlewares/error.middleware");
const createFoodEntry = async (userId, input) => database_1.prisma.foodEntry.create({
    data: { ...input, userId, date: input.date ? new Date(input.date) : new Date() },
});
exports.createFoodEntry = createFoodEntry;
const getFoodEntries = async (userId, filters) => {
    const { startDate, endDate, mealType, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;
    const where = {
        userId,
        ...(startDate || endDate
            ? { date: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
            : {}),
        ...(mealType ? { mealType: mealType } : {}),
    };
    const [entries, total] = await Promise.all([
        database_1.prisma.foodEntry.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
        database_1.prisma.foodEntry.count({ where }),
    ]);
    return { entries, total, page, limit, pages: Math.ceil(total / limit) };
};
exports.getFoodEntries = getFoodEntries;
const getFoodEntryById = async (id, userId) => {
    const entry = await database_1.prisma.foodEntry.findFirst({ where: { id, userId } });
    if (!entry)
        throw new error_middleware_1.AppError('Entrée alimentaire introuvable', 404);
    return entry;
};
exports.getFoodEntryById = getFoodEntryById;
const updateFoodEntry = async (id, userId, input) => {
    const existing = await database_1.prisma.foodEntry.findFirst({ where: { id, userId } });
    if (!existing)
        throw new error_middleware_1.AppError('Entrée alimentaire introuvable', 404);
    return database_1.prisma.foodEntry.update({
        where: { id },
        data: { ...input, ...(input.date ? { date: new Date(input.date) } : {}) },
    });
};
exports.updateFoodEntry = updateFoodEntry;
const deleteFoodEntry = async (id, userId) => {
    const existing = await database_1.prisma.foodEntry.findFirst({ where: { id, userId } });
    if (!existing)
        throw new error_middleware_1.AppError('Entrée alimentaire introuvable', 404);
    await database_1.prisma.foodEntry.delete({ where: { id } });
};
exports.deleteFoodEntry = deleteFoodEntry;
const getDailyNutritionSummary = async (userId, date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const entries = await database_1.prisma.foodEntry.findMany({
        where: { userId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
    });
    const byMealType = { breakfast: [], lunch: [], dinner: [], snack: [] };
    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;
    for (const e of entries) {
        totalCalories += e.calories;
        totalProtein += e.protein ?? 0;
        totalCarbs += e.carbs ?? 0;
        totalFat += e.fat ?? 0;
        totalFiber += e.fiber ?? 0;
        byMealType[e.mealType].push(e);
    }
    return { date, totalCalories, totalProtein, totalCarbs, totalFat, totalFiber, byMealType, entries };
};
exports.getDailyNutritionSummary = getDailyNutritionSummary;
//# sourceMappingURL=food.service.js.map