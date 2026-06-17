import dotenv from 'dotenv';
dotenv.config();

const get = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  NODE_ENV: get('NODE_ENV', 'development'),
  PORT: parseInt(get('PORT', '5000'), 10),
  DATABASE_URL: get('DATABASE_URL', 'postgresql://postgres:password@localhost:55432/healthai'),
  MONGODB_URI: get('MONGODB_URI', 'mongodb://localhost:27017/healthai'),
  JWT_SECRET: get('JWT_SECRET', 'dev-secret-change-in-production'),
  JWT_EXPIRES_IN: get('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_SECRET: get('JWT_REFRESH_SECRET', 'dev-refresh-change-in-production'),
  JWT_REFRESH_EXPIRES_IN: get('JWT_REFRESH_EXPIRES_IN', '7d'),
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'],
  OPENAI_MODEL: get('OPENAI_MODEL', 'gpt-4o-mini'),
  CORS_ORIGIN: get('CORS_ORIGIN', 'http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: parseInt(get('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(get('RATE_LIMIT_MAX', '100'), 10),
} as const;
