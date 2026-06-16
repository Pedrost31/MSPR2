import { prisma } from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { AppError } from '../middlewares/error.middleware';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

const USER_SELECT = {
  id: true, email: true, name: true, age: true, weight: true,
  height: true, gender: true, activityLevel: true, goal: true,
  dailyCalorieTarget: true, createdAt: true,
} as const;

const refreshExpiresAt = (): Date => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('Email déjà utilisé', 409);

  const user = await prisma.user.create({
    data: { ...input, password: await hashPassword(input.password) },
    select: USER_SELECT,
  });

  const accessToken  = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt() },
  });

  return { user, accessToken, refreshToken };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await comparePassword(input.password, user.password))) {
    throw new AppError('Email ou mot de passe incorrect', 401);
  }

  const accessToken  = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: refreshExpiresAt() },
  });

  const { password: _pw, ...safe } = user;
  return { user: safe, accessToken, refreshToken };
};

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token);

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Token de rafraîchissement invalide ou expiré', 401);
  }

  await prisma.refreshToken.delete({ where: { token } });

  const accessToken     = generateAccessToken({ userId: payload.userId, email: payload.email });
  const newRefreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email });
  await prisma.refreshToken.create({
    data: { userId: payload.userId, token: newRefreshToken, expiresAt: refreshExpiresAt() },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};
