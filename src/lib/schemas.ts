import { z } from 'zod'

export const SetupSchema = z.object({
  householdName: z.string().min(1).max(100),
  adminName: z.string().min(1).max(100),
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'lowercase letters, numbers, _ and - only'),
  password: z.string().min(8),
})

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'lowercase letters, numbers, _ and - only'),
  name: z.string().max(100).optional(),
  password: z.string().min(8),
  isAdmin: z.boolean().optional().default(false),
})

export const ResetPasswordSchema = z.object({
  password: z.string().min(8),
})

export const CreateProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  userId: z.string().cuid(),
  avatar: z.string().max(4).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export const HouseholdNameSchema = z.object({
  name: z.string().min(1).max(100),
})

export const CreateTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  description: z.string().max(200).optional(),
  categoryId: z.string().min(1),
  date: z
    .string()
    .transform((s) => new Date(s))
    .refine((d) => !isNaN(d.getTime()), { message: 'Invalid date' }),
  originProfileId: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

export const UpdateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().max(200).nullable().optional(),
  categoryId: z.string().min(1).optional(),
  date: z
    .string()
    .transform((s) => new Date(s))
    .refine((d) => !isNaN(d.getTime()), { message: 'Invalid date' })
    .optional(),
  originProfileId: z.string().nullable().optional(),
})
