import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { hashPassword } from '../utils/bcrypt.utils';
import { UpdateUserInput } from '../schemas/user.schema';

const USER_SELECT = {
  id: true, email: true, name: true, age: true, weight: true,
  height: true, gender: true, activityLevel: true, goal: true,
  dailyCalorieTarget: true, createdAt: true, updatedAt: true,
  goalSettings: true,
} as const;

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  return user;
};

export const updateUser = async (userId: string, input: UpdateUserInput) => {
  const data: Record<string, unknown> = { ...input };
  if (input.password) {
    data['password'] = await hashPassword(input.password);
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true, email: true, name: true, age: true, weight: true,
      height: true, gender: true, activityLevel: true, goal: true,
      dailyCalorieTarget: true, updatedAt: true,
    },
  });
};

export const deleteUser = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
};
