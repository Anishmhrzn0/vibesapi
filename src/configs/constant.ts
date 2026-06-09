import dotenv from 'dotenv';
dotenv.config();

export const CONSTANTS = {
  PORT:          process.env.PORT          ?? '4000',
  MONGODB_URI:   process.env.MONGODB_URI   ?? 'mongodb://localhost:27017/vibes',
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: '7d',
  FRONTEND_URL:  process.env.FRONTEND_URL  ?? 'http://localhost:3000',
  SALT_ROUNDS:   12,
} as const;