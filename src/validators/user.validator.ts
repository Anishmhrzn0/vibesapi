import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});