import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: Request) {
  return requireAuth(async (session) => {
    if (!session.profileId) {
      return NextResponse.json({ error: 'No profile' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const date = month ? new Date(month + '-01') : new Date()
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    const [transactions, goals] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          profileId: session.profileId,
          date: { gte: start, lte: end },
        },
        include: {
          category: { select: { id: true, name: true, icon: true, color: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.goal.findMany({
        where: { profileId: session.profileId },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + Number(t.amount), 0)
    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + Number(t.amount), 0)

    return NextResponse.json({
      income,
      expense,
      balance: income - expense,
      recentTransactions: transactions.slice(0, 5).map((t) => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      goals: goals.map((g) => ({
        ...g,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        deadline: g.deadline?.toISOString() ?? null,
        createdAt: g.createdAt.toISOString(),
      })),
    })
  })
}
