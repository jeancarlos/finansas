import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import { CreateTransactionSchema } from '@/lib/schemas'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: Request) {
  return requireAuth(async (session) => {
    if (!session.profileId || !session.householdId) {
      return NextResponse.json({ error: 'No profile' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month')
    const type = searchParams.get('type')
    const view = searchParams.get('view') ?? 'individual'

    const date = month ? new Date(month + '-01') : new Date()
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    const profileIds =
      view === 'household'
        ? (
            await prisma.profile.findMany({
              where: { householdId: session.householdId },
              select: { id: true },
            })
          ).map((p) => p.id)
        : [session.profileId]

    const transactions = await prisma.transaction.findMany({
      where: {
        profileId: { in: profileIds },
        date: { gte: start, lte: end },
        ...(type === 'INCOME' || type === 'EXPENSE' ? { type } : {}),
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
        originProfile: { select: { id: true, displayName: true, color: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(transactions)
  })
}

export async function POST(req: Request) {
  return requireAuth(async (session) => {
    if (!session.profileId) {
      return NextResponse.json({ error: 'No profile' }, { status: 400 })
    }

    const body = await req.json()
    const result = CreateTransactionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { type, amount, description, categoryId, date, originProfileId, isRecurring } =
      result.data

    const transaction = await prisma.transaction.create({
      data: {
        profileId: session.profileId,
        originProfileId: originProfileId ?? session.profileId,
        type,
        amount,
        description: description ?? null,
        categoryId,
        date,
        isRecurring,
      },
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  })
}
