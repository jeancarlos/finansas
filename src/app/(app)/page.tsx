'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useInitialAnimation } from '@/hooks/use-initial-animation'
import { ArrowUpRight, ArrowDownRight, Wallet, Target, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useProfile } from '@/hooks/use-profile'
import { useLocale } from '@/hooks/use-locale'
import { GlassCard } from '@/components/glass-card'
import { Money } from '@/components/money'
import { getLucideIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'

type SummaryData = {
  income: number
  expense: number
  balance: number
  recentTransactions: {
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    description: string | null
    date: string
    category: {
      id: string
      name: string
      icon: string
      color: string
    }
  }[]
  goals: {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline: string | null
    icon: string
  }[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

export default function DashboardPage() {
  const shouldAnimate = useInitialAnimation()
  const { profileId, profileColor } = useProfile()
  const { t, formatDateOnly } = useLocale()
  const m = t('home')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/summary')
      if (res.ok) setSummary(await res.json())
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const onSaved = () => fetchData()
    window.addEventListener('transaction-saved', onSaved)
    return () => window.removeEventListener('transaction-saved', onSaved)
  }, [fetchData])

  const accentColor = profileColor ?? '#6366f1'

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200"
          style={{ borderTopColor: accentColor }}
        />
      </div>
    )
  }

  const isPositive = summary.balance >= 0

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      variants={stagger}
      initial={shouldAnimate ? 'hidden' : false}
      animate="show"
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between gap-2"
        variants={fadeUp}
      >
        <span className="font-brand text-xl font-extrabold tracking-tight text-slate-700">
          Pigüi
        </span>
      </motion.div>

      {/* Balance card */}
      <motion.div variants={fadeUp}>
        <Link href="/transactions">
          <GlassCard hoverable className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `linear-gradient(to right, white 40%, ${accentColor}10 100%)` }}
            />
            <div className="pointer-events-none absolute right-0 top-0 h-full">
              <Image
                src="/images/pigui-saldo-financeiro-mensal.png"
                alt=""
                width={200}
                height={120}
                className="h-full w-auto object-cover object-left"
              />
            </div>
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-1.5">
                <Wallet size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-400">{m.balance}</span>
              </div>
              <p
                className={cn(
                  'text-3xl font-bold tracking-tight sm:text-4xl',
                  isPositive ? 'text-emerald-600' : 'text-red-500'
                )}
              >
                <Money value={summary.balance} />
              </p>
            </div>
          </GlassCard>
        </Link>
      </motion.div>

      {/* Income + Expense grid */}
      <motion.div className="grid grid-cols-2 gap-3" variants={fadeUp}>
        <GlassCard
          hoverable
          className="p-4"
          onClick={() =>
            window.dispatchEvent(new CustomEvent('fab-add-typed', { detail: { type: 'INCOME' } }))
          }
        >
          <div className="mb-1 flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <ArrowUpRight size={14} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-400">{m.income}</span>
          </div>
          <p className="text-base font-semibold text-emerald-600 sm:text-lg">
            <Money value={summary.income} />
          </p>
        </GlassCard>

        <GlassCard
          hoverable
          className="p-4"
          onClick={() =>
            window.dispatchEvent(new CustomEvent('fab-add-typed', { detail: { type: 'EXPENSE' } }))
          }
        >
          <div className="mb-1 flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
              <ArrowDownRight size={14} className="text-red-500" />
            </div>
            <span className="text-xs text-slate-400">{m.expense}</span>
          </div>
          <p className="text-base font-semibold text-red-500 sm:text-lg">
            <Money value={summary.expense} />
          </p>
        </GlassCard>
      </motion.div>

      {/* Goals */}
      {summary.goals.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="mb-3 flex items-center gap-2">
            <Target size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500">{m.goals}</h2>
          </div>
          <GlassCard hoverable={false} className="divide-y divide-slate-100 p-0">
            {summary.goals.map((goal) => {
              const progress =
                goal.targetAmount > 0
                  ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                  : 0
              const GoalIcon = getLucideIcon(goal.icon)

              return (
                <Link key={goal.id} href="/goals" className="block px-4 py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GoalIcon size={16} style={{ color: accentColor }} />
                      <span className="text-sm font-medium text-slate-700">{goal.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: accentColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-400">
                    <Money value={goal.currentAmount} />
                    <Money value={goal.targetAmount} />
                  </div>
                </Link>
              )
            })}
          </GlassCard>
        </motion.div>
      )}

      {/* Recent transactions */}
      {summary.recentTransactions.length > 0 && (
        <motion.div variants={fadeUp}>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">{m.recentTransactions}</h2>
          <GlassCard hoverable={false} className="divide-y divide-slate-100 p-0">
            {summary.recentTransactions.map((tx) => {
              const Icon = getLucideIcon(tx.category.icon)
              const isIncome = tx.type === 'INCOME'

              return (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: tx.category.color + '18',
                      color: tx.category.color,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {tx.description || tx.category.name}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateOnly(tx.date)}</p>
                  </div>
                  <p
                    className={cn(
                      'shrink-0 whitespace-nowrap text-sm font-semibold',
                      isIncome ? 'text-emerald-600' : 'text-red-500'
                    )}
                  >
                    <Money value={tx.amount} prefix={isIncome ? '+' : '-'} />
                  </p>
                </div>
              )
            })}
          </GlassCard>
        </motion.div>
      )}

      {/* Empty state */}
      {summary.recentTransactions.length === 0 && summary.goals.length === 0 && (
        <motion.div variants={fadeUp} className="py-12 text-center text-slate-400">
          <Wallet size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{m.noTransactions}</p>
          <p className="text-sm">{m.tapToAdd}</p>
        </motion.div>
      )}

      {/* Projections link */}
      <motion.div variants={fadeUp}>
        <Link href="/projections">
          <GlassCard hoverable className="relative overflow-hidden p-4">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `linear-gradient(to right, white 40%, ${accentColor}10 100%)` }}
            />
            <div className="pointer-events-none absolute right-0 top-0 h-full">
              <Image
                src="/images/pigui-app-controle-financeiro.png"
                alt=""
                width={160}
                height={100}
                className="h-full w-auto object-cover object-left"
              />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: accentColor + '18', color: accentColor }}
              >
                <TrendingUp size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">{m.projections}</p>
                <p className="text-xs text-slate-400">{m.projectionsSubtitle}</p>
              </div>
              <ArrowUpRight size={16} className="text-slate-300" />
            </div>
          </GlassCard>
        </Link>
      </motion.div>
    </motion.div>
  )
}
