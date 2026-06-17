import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../types';

export const generateAccessToken = (payload: { userId: string; email: string }): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const generateRefreshToken = (payload: { userId: string; email: string }): string =>
  jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions,
  );

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
