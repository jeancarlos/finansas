import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> }

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter }).$extends({
    result: {
      transaction: {
        amount: {
          needs: { amount: true },
          compute: (t) => Number(t.amount),
        },
      },
      goal: {
        targetAmount: {
          needs: { targetAmount: true },
          compute: (g) => Number(g.targetAmount),
        },
        currentAmount: {
          needs: { currentAmount: true },
          compute: (g) => Number(g.currentAmount),
        },
      },
      recurringRule: {
        templateAmount: {
          needs: { templateAmount: true },
          compute: (r) => (r.templateAmount == null ? null : Number(r.templateAmount)),
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
