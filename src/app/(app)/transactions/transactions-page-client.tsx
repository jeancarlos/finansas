'use client'

import { useEffect, useState, useCallback, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useInitialAnimation } from '@/hooks/use-initial-animation'
import { ChevronLeft, ChevronRight, Receipt, Trash2, MoreHorizontal, Pencil, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format, addMonths, subMonths, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { useLocale } from '@/hooks/use-locale'
import { GlassCard } from '@/components/glass-card'
import { Money } from '@/components/money'
import { getLucideIcon } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { formatDateOnly } from '@/lib/locale'

type Category = { id: string; name: string; icon: string | null; color: string | null }
type OriginProfile = { id: string; displayName: string; color: string } | null

type Transaction = {
  id: string
  type: string
  amount: number
  description: string | null
  date: string
  categoryId: string
  originProfileId: string | null
  category: Category
  originProfile: OriginProfile
}

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE'

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export function TransactionsPageClient({
  initialTransactions,
}: {
  initialTransactions: Transaction[]
}) {
  const shouldAnimate = useInitialAnimation()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { t } = useLocale()
  const m = t('transactions')
  const c = t('common')

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [loading, setLoading] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const monthKey = format(currentMonth, 'yyyy-MM')

  const fetchTransactions = useCallback(async (month: Date) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions?month=${format(month, 'yyyy-MM')}`)
      if (res.ok) setTransactions(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => fetchTransactions(currentMonth)
    window.addEventListener('transaction-saved', handler)
    return () => window.removeEventListener('transaction-saved', handler)
  }, [currentMonth, fetchTransactions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-menu]')) setActiveMenu(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navigateMonth = (direction: 1 | -1) => {
    const next = direction === 1 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1)
    setCurrentMonth(next)
    fetchTransactions(next)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(m.confirmDelete)) return
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id))
      setActiveMenu(null)
    }
  }

  const handleEdit = (tx: Transaction) => {
    window.dispatchEvent(
      new CustomEvent('edit-transaction', {
        detail: {
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          description: tx.description,
          date: tx.date,
          categoryId: tx.categoryId,
          originProfileId: tx.originProfileId,
        },
      }),
    )
    setActiveMenu(null)
  }

  const filtered = useMemo(
    () => (filter === 'ALL' ? transactions : transactions.filter((tx) => tx.type === filter)),
    [transactions, filter],
  )

  const totalIncome = filtered
    .filter((tx) => tx.type === 'INCOME')
    .reduce((s, tx) => s + Number(tx.amount), 0)
  const totalExpense = filtered
    .filter((tx) => tx.type === 'EXPENSE')
    .reduce((s, tx) => s + Number(tx.amount), 0)

  return (
    <motion.div
      className="space-y-4"
      variants={stagger}
      initial={shouldAnimate ? 'hidden' : false}
      animate="show"
    >
      {/* Month navigation */}
      <motion.div className="flex items-center justify-between" variants={fadeUp}>
        <button
          onClick={() => navigateMonth(-1)}
          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 active:scale-95"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="text-sm font-medium capitalize text-slate-500">
          {format(currentMonth, 'MMMM yyyy')}
        </p>
        <button
          onClick={() => navigateMonth(1)}
          className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 active:scale-95"
          aria-label="Next month"
        >
          <ChevronRight size={20} />
        </button>
      </motion.div>

      {/* Summary cards */}
      <motion.div className="grid grid-cols-2 gap-3" variants={fadeUp}>
        <GlassCard hoverable={false} className="p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <ArrowUpRight size={14} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-400">{m.income}</span>
          </div>
          <p className="text-lg font-semibold text-emerald-600">
            <Money value={totalIncome} />
          </p>
        </GlassCard>
        <GlassCard hoverable={false} className="p-4">
          <div className="mb-1 flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
              <ArrowDownRight size={14} className="text-red-500" />
            </div>
            <span className="text-xs text-slate-400">{m.expenses}</span>
          </div>
          <p className="text-lg font-semibold text-red-500">
            <Money value={totalExpense} />
          </p>
        </GlassCard>
      </motion.div>

      {/* Filter tabs */}
      <motion.div className="flex gap-2" variants={fadeUp}>
        {([
          { key: 'ALL', label: m.all },
          { key: 'INCOME', label: m.income },
          { key: 'EXPENSE', label: m.expenses },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-medium transition-colors',
              filter === key
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
            )}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} className="py-16 text-center text-slate-400">
          <Receipt size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{m.noTransactions}</p>
          <p className="text-sm">{m.noTransactionsMonth}</p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp}>
          <GlassCard hoverable={false} className="overflow-visible divide-y divide-slate-100 p-0">
            <AnimatePresence mode="popLayout">
              {filtered.map((tx) => {
                const Icon = getLucideIcon(tx.category.icon ?? 'Circle')
                const color = tx.category.color ?? '#6b7280'
                const isIncome = tx.type === 'INCOME'

                return (
                  <motion.div
                    key={tx.id}
                    className="group relative flex cursor-pointer items-center gap-3 px-4 py-3 active:bg-slate-50"
                    layout
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    onClick={() => handleEdit(tx)}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: color + '18', color }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {tx.description || tx.category.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateOnly(parseISO(tx.date))}
                      </p>
                    </div>
                    <div className="relative flex items-center gap-2">
                      <p
                        className={cn(
                          'mr-2 whitespace-nowrap text-sm font-semibold',
                          isIncome ? 'text-emerald-600' : 'text-red-500',
                        )}
                      >
                        <Money value={Number(tx.amount)} prefix={isIncome ? '+' : '-'} />
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === tx.id ? null : tx.id)
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                        aria-label={c.edit}
                        data-menu
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      <AnimatePresence>
                        {activeMenu === tx.id && (
                          <motion.div
                            data-menu
                            className="absolute right-0 top-10 z-[100] w-40 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5"
                            initial={{ opacity: 0, scale: 0.9, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -8 }}
                          >
                            <button
                              onClick={(e) => { e.stopPropagation(); handleEdit(tx) }}
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              <Pencil size={14} className="text-slate-400" />
                              {c.edit}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(tx.id) }}
                              className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              {c.delete}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  )
}
