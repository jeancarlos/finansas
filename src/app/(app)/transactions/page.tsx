import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { startOfMonth, endOfMonth } from 'date-fns'
import { TransactionsPageClient } from './transactions-page-client'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.profileId) redirect('/login')

  const now = new Date()
  const transactions = await prisma.transaction.findMany({
    where: {
      profileId: session.user.profileId,
      date: { gte: startOfMonth(now), lte: endOfMonth(now) },
    },
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
      originProfile: { select: { id: true, displayName: true, color: true } },
    },
    orderBy: { date: 'desc' },
  })

  const serialized = transactions.map((tx) => ({
    ...tx,
    amount: Number(tx.amount),
    date: tx.date.toISOString(),
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  }))

  return <TransactionsPageClient initialTransactions={serialized} />
}
