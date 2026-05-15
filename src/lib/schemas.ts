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
  avatar: z.string().optional(),
})

export const HouseholdNameSchema = z.object({
  name: z.string().min(1).max(100),
})
