'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CategoryPicker } from './category-picker'
import { CurrencyInput } from './currency-input'
import { parseAmount } from '@/lib/locale'
import { useLocale } from '@/hooks/use-locale'

type Profile = { id: string; displayName: string; avatar: string; color: string }

type EditingTransaction = {
  id: string
  type: 'EXPENSE' | 'INCOME'
  amount: number
  description: string | null
  date: string
  categoryId: string
  originProfileId: string | null
}

type QuickAddProps = {
  profileId: string
  accentColor: string
}

export function QuickAdd({ profileId, accentColor }: QuickAddProps) {
  const { t } = useLocale()
  const m = t('transactions')
  const c = t('common')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EditingTransaction | null>(null)
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY' | 'YEARLY'>('MONTHLY')
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [date, setDate] = useState('')
  const [originProfileId, setOriginProfileId] = useState(profileId)
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<
    { id: string; name: string; icon: string | null; color: string | null }[]
  >([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const profilesRef = useRef(profiles)
  profilesRef.current = profiles

  const fetchCategories = async (txType: 'EXPENSE' | 'INCOME') => {
    try {
      const res = await fetch(`/api/categories?type=${txType}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        if (!categoryId || !data.find((c: { id: string }) => c.id === categoryId)) {
          setCategoryId(data[0]?.id ?? '')
        }
      }
    } catch {
      setCategories([])
    }
  }

  const fetchProfiles = () => {
    if (profilesRef.current.length > 0) return
    fetch('/api/profiles')
      .then((r) => r.json())
      .then((data: Profile[]) => setProfiles(data))
      .catch(() => {})
  }

  useEffect(() => {
    if (open) fetchCategories(type)
  }, [type, open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleOpen = () => { setOpen(true); fetchProfiles() }
    const handleEdit = (e: Event) => {
      const tx = (e as CustomEvent<EditingTransaction>).detail
      setEditing(tx)
      setType(tx.type)
      setAmount(String(tx.amount))
      setCategoryId(tx.categoryId)
      setDescription(tx.description ?? '')
      setDate(tx.date.split('T')[0])
      setOriginProfileId(tx.originProfileId ?? profileId)
      setStep(1)
      setOpen(true)
      fetchProfiles()
    }
    window.addEventListener('fab-add-transaction', handleOpen)
    window.addEventListener('edit-transaction', handleEdit)
    return () => {
      window.removeEventListener('fab-add-transaction', handleOpen)
      window.removeEventListener('edit-transaction', handleEdit)
    }
  }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) setOriginProfileId(profileId)
  }, [profileId, open])

  const reset = () => {
    setEditing(null)
    setType('EXPENSE')
    setAmount('')
    setCategoryId('')
    setDescription('')
    setIsRecurring(false)
    setFrequency('MONTHLY')
    setDayOfMonth('')
    setDate('')
    setStep(1)
    setOriginProfileId(profileId)
  }

  const handleClose = () => { setOpen(false); reset() }

  const handleSave = async () => {
    const value = parseAmount(amount)
    if (!value || value <= 0 || !categoryId) return
    setSaving(true)
    try {
      const txDate = date
        ? new Date(date + 'T12:00:00').toISOString()
        : new Date().toISOString()

      if (editing) {
        const res = await fetch(`/api/transactions/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: value,
            description: description || null,
            categoryId,
            date: txDate,
            originProfileId: originProfileId || null,
          }),
        })
        if (res.ok) {
          window.dispatchEvent(new CustomEvent('transaction-saved'))
          handleClose()
        }
      } else {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            amount: value,
            description: description || undefined,
            categoryId,
            date: txDate,
            originProfileId: originProfileId || profileId,
            isRecurring,
          }),
        })
        if (res.ok) {
          window.dispatchEvent(new CustomEvent('transaction-saved'))
          handleClose()
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const canSave = parseAmount(amount) > 0 && !!categoryId

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-lg rounded-t-3xl bg-white p-6 pb-10 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">
                {editing ? m.editTransaction : m.newTransaction}
              </h2>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label={c.cancel}
              >
                <X size={20} />
              </button>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <>
                {/* Type toggle */}
                <div className="mb-4 flex gap-2">
                  {(['EXPENSE', 'INCOME'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => !editing && setType(t)}
                      disabled={!!editing}
                      className={cn(
                        'flex-1 rounded-xl py-2 text-sm font-medium transition-colors',
                        type === t
                          ? t === 'EXPENSE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400',
                        editing && 'cursor-not-allowed opacity-60',
                      )}
                    >
                      {t === 'EXPENSE' ? m.expense : m.income}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div className="mb-4 flex items-baseline gap-1">
                  <CurrencyInput
                    placeholder="0"
                    value={amount}
                    onValueChange={setAmount}
                    className="w-full bg-transparent text-4xl font-semibold text-slate-800 outline-none placeholder:text-slate-200"
                    autoFocus
                  />
                </div>

                {/* Category */}
                <div className="mb-4">
                  <CategoryPicker
                    categories={categories}
                    value={categoryId}
                    onChange={setCategoryId}
                  />
                </div>

                {/* Description */}
                <input
                  type="text"
                  placeholder={m.description}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  className="mb-3 w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-slate-200"
                />

                {/* Recurring (create only) */}
                {!editing && (
                  <div className="mb-4">
                    <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                      <button
                        type="button"
                        onClick={() => setIsRecurring((r) => !r)}
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
                          isRecurring
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-slate-300',
                        )}
                        aria-pressed={isRecurring}
                      >
                        {isRecurring && <Check size={14} />}
                      </button>
                      {m.recurring}
                    </label>

                    {isRecurring && (
                      <div className="space-y-3 rounded-2xl bg-indigo-50 p-3">
                        <div className="flex gap-2">
                          {(['MONTHLY', 'WEEKLY', 'YEARLY'] as const).map((freq) => (
                            <button
                              key={freq}
                              type="button"
                              onClick={() => setFrequency(freq)}
                              className={cn(
                                'flex-1 rounded-xl py-1.5 text-xs font-medium transition-colors',
                                frequency === freq
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-white text-slate-500 hover:bg-slate-50',
                              )}
                            >
                              {freq === 'MONTHLY' ? m.monthly : freq === 'WEEKLY' ? m.weekly : m.yearly}
                            </button>
                          ))}
                        </div>
                        {frequency === 'MONTHLY' && (
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="31"
                            value={dayOfMonth}
                            onChange={(e) => setDayOfMonth(e.target.value)}
                            placeholder={m.dayOfMonth}
                            className="w-full rounded-xl bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-300"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !canSave}
                    className="flex-1 rounded-2xl py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: accentColor }}
                  >
                    {saving ? c.saving : c.save}
                  </button>
                  <button
                    onClick={() => {
                      if (!date) setDate(new Date().toISOString().split('T')[0])
                      setStep(2)
                      fetchProfiles()
                    }}
                    disabled={!canSave}
                    className="rounded-2xl px-5 py-3.5 text-base font-semibold transition-opacity disabled:opacity-40 bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    {m.details}
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Date */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {m.date}
                  </p>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {/* Origin profile */}
                {profiles.length > 1 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {m.origin}
                    </p>
                    <div className="flex gap-2">
                      {profiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setOriginProfileId(p.id)}
                          className={cn(
                            'flex flex-1 items-center gap-2 rounded-2xl border-2 px-3 py-2 transition-all',
                            originProfileId === p.id
                              ? 'border-slate-800 bg-slate-800 text-white shadow-md'
                              : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200',
                          )}
                        >
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: p.color }}
                          >
                            {p.avatar || p.displayName[0].toUpperCase()}
                          </span>
                          <span className="text-sm font-medium">{p.displayName.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !canSave}
                    className="flex-1 rounded-2xl py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: accentColor }}
                  >
                    {saving ? c.saving : c.save}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 rounded-2xl px-5 py-3.5 text-base font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    <ChevronLeft size={18} />
                    {m.details.split(' ')[0]}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
