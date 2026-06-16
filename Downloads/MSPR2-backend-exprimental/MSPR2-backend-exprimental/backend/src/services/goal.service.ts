import { prisma } from '../config/database';
import { UpdateGoalInput } from '../schemas/goal.schema';

export const getGoals = async (userId: string) => {
  const goal = await prisma.goalSettings.findUnique({ where: { userId } });
  if (goal) return goal;
  return prisma.goalSettings.create({ data: { userId } });
};

export const updateGoals = async (userId: string, input: UpdateGoalInput) =>
  prisma.goalSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
  });
