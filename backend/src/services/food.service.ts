import { MealType } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { CreateFoodEntryInput, UpdateFoodEntryInput } from '../schemas/food.schema';

export const createFoodEntry = async (userId: string, input: CreateFoodEntryInput) =>
  prisma.foodEntry.create({
    data: { ...input, userId, date: input.date ? new Date(input.date) : new Date() },
  });

interface FoodFilters {
  startDate?: string;
  endDate?: string;
  mealType?: string;
  page?: number;
  limit?: number;
}

export const getFoodEntries = async (userId: string, filters: FoodFilters) => {
  const { startDate, endDate, mealType, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(startDate || endDate
      ? { date: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
      : {}),
    ...(mealType ? { mealType: mealType as MealType } : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.foodEntry.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.foodEntry.count({ where }),
  ]);

  return { entries, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getFoodEntryById = async (id: string, userId: string) => {
  const entry = await prisma.foodEntry.findFirst({ where: { id, userId } });
  if (!entry) throw new AppError('Entrée alimentaire introuvable', 404);
  return entry;
};

export const updateFoodEntry = async (id: string, userId: string, input: UpdateFoodEntryInput) => {
  const existing = await prisma.foodEntry.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError('Entrée alimentaire introuvable', 404);
  return prisma.foodEntry.update({
    where: { id },
    data: { ...input, ...(input.date ? { date: new Date(input.date) } : {}) },
  });
};

export const deleteFoodEntry = async (id: string, userId: string) => {
  const existing = await prisma.foodEntry.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError('Entrée alimentaire introuvable', 404);
  await prisma.foodEntry.delete({ where: { id } });
};

export const getDailyNutritionSummary = async (userId: string, date: string) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const entries = await prisma.foodEntry.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: { date: 'asc' },
  });

  type MealBucket = { breakfast: typeof entries; lunch: typeof entries; dinner: typeof entries; snack: typeof entries };
  const byMealType: MealBucket = { breakfast: [], lunch: [], dinner: [], snack: [] };
  let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalFiber = 0;

  for (const e of entries) {
    totalCalories += e.calories;
    totalProtein  += e.protein ?? 0;
    totalCarbs    += e.carbs ?? 0;
    totalFat      += e.fat ?? 0;
    totalFiber    += e.fiber ?? 0;
    byMealType[e.mealType].push(e);
  }

  return { date, totalCalories, totalProtein, totalCarbs, totalFat, totalFiber, byMealType, entries };
};
