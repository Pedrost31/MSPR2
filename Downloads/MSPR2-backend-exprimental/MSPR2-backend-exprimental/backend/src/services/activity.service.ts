import { ActivityType } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { CreateActivityInput, UpdateActivityInput } from '../schemas/activity.schema';

export const createActivity = async (userId: string, input: CreateActivityInput) =>
  prisma.activityEntry.create({
    data: {
      ...input,
      userId,
      type: (input.type as ActivityType) ?? 'other',
      date: input.date ? new Date(input.date) : new Date(),
    },
  });

interface ActivityFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const getActivities = async (userId: string, filters: ActivityFilters) => {
  const { startDate, endDate, type, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(startDate || endDate
      ? { date: { ...(startDate ? { gte: new Date(startDate) } : {}), ...(endDate ? { lte: new Date(endDate) } : {}) } }
      : {}),
    ...(type ? { type: type as ActivityType } : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.activityEntry.findMany({ where, skip, take: limit, orderBy: { date: 'desc' } }),
    prisma.activityEntry.count({ where }),
  ]);

  return { entries, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getActivityById = async (id: string, userId: string) => {
  const entry = await prisma.activityEntry.findFirst({ where: { id, userId } });
  if (!entry) throw new AppError('Activité introuvable', 404);
  return entry;
};

export const updateActivity = async (id: string, userId: string, input: UpdateActivityInput) => {
  const existing = await prisma.activityEntry.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError('Activité introuvable', 404);
  return prisma.activityEntry.update({
    where: { id },
    data: { ...input, ...(input.date ? { date: new Date(input.date) } : {}) },
  });
};

export const deleteActivity = async (id: string, userId: string) => {
  const existing = await prisma.activityEntry.findFirst({ where: { id, userId } });
  if (!existing) throw new AppError('Activité introuvable', 404);
  await prisma.activityEntry.delete({ where: { id } });
};

export const getWeeklyActivitySummary = async (userId: string) => {
  const start = new Date();
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);

  const activities = await prisma.activityEntry.findMany({
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
