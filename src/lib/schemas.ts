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
