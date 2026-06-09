import { z } from 'zod';

export const RegisterDto = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
  email:    z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone:    z.string().regex(/^\d{7,15}$/, 'Enter a valid phone number (digits only)'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginDto = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType    = z.infer<typeof LoginDto>;