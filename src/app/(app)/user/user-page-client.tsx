'use client'

import { useState, useEffect } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Home, ChevronRight, Check, Pencil, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useProfile } from '@/hooks/use-profile'
import { useInitialAnimation } from '@/hooks/use-initial-animation'
import { useLocale } from '@/hooks/use-locale'
import { PROFILE_COLORS } from '@/lib/profile-colors'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const AVATARS = [
  '😀','😎','🤓','🧐','🥳','😇','🤩','😍',
  '🐱','🐻','🦊','🐼','🐨','🐸','🐯','🦁',
  '🚀','⭐','💎','🎯','🌈','🏆','🌺','🎨',
]

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }

type ProfileData = {
  id: string
  displayName: string
  avatar: string
  color: string
  user: { username: string }
  household: { id: string; name: string } | null
}

export function UserPageClient() {
  const shouldAnimate = useInitialAnimation()
  const router = useRouter()
  const { update } = useSession()
  const { isAdmin } = useProfile()
  const { t } = useLocale()
  const m = t('user')
  const common = t('common')

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  // Edit display name
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Avatar/color picker
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingAvatar, setPendingAvatar] = useState('')
  const [pendingColor, setPendingColor] = useState('')

  // Change password
  const [pwOpen, setPwOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [savingPw, setSavingPw] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/profile/me')
      .then((r) => {
        if (!r.ok) {
          signOut({ callbackUrl: '/login' })
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) {
          setProfile(data)
          setNameValue(data.displayName)
          setPendingAvatar(data.avatar)
          setPendingColor(data.color)
        }
        setLoading(false)
      })
      .catch(() => signOut({ callbackUrl: '/login' }))
  }, [])

  async function saveName() {
    if (!profile || !nameValue.trim() || nameValue === profile.displayName) {
      setEditingName(false)
      return
    }
    setSavingName(true)
    const res = await fetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: nameValue.trim() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProfile((p) => p ? { ...p, displayName: updated.displayName } : p)
    }
    setSavingName(false)
    setEditingName(false)
  }

  async function savePicker() {
    if (!profile) return
    const changed = pendingAvatar !== profile.avatar || pendingColor !== profile.color
    if (!changed) { setPickerOpen(false); return }
    const res = await fetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: pendingAvatar, color: pendingColor }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProfile((p) => p ? { ...p, avatar: updated.avatar, color: updated.color } : p)
      await update()
    }
    setPickerOpen(false)
  }

  async function changePassword() {
    if (!newPw || newPw.length < 8) {
      setPwError(m.passwordTooShort)
      return
    }
    setSavingPw(true)
    setPwError(null)
    const res = await fetch('/api/profile/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    })
    setSavingPw(false)
    if (res.status === 403) { setPwError(m.wrongPassword); return }
    if (!res.ok) { setPwError(common.error); return }
    setPwOpen(false)
    setCurrentPw('')
    setNewPw('')
  }

  async function deleteProfile() {
    if (!profile) return
    setDeleting(true)
    const res = await fetch(`/api/profiles/${profile.id}`, { method: 'DELETE' })
    if (res.ok) {
      await signOut({ callbackUrl: '/login' })
    }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 pt-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-20 w-20 rounded-full bg-slate-200" />
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
        <div className="h-16 rounded-2xl bg-slate-200" />
        <div className="h-16 rounded-2xl bg-slate-200" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <motion.div
      className="space-y-8 pb-8"
      variants={stagger}
      initial={shouldAnimate ? 'hidden' : false}
      animate="show"
    >
      {/* Avatar header */}
      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 pt-4">
        <button
          onClick={() => setPickerOpen(true)}
          className="relative flex h-20 w-20 items-center justify-center rounded-full text-4xl transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: profile.color + '28' }}
        >
          {profile.avatar || '👤'}
          <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200 text-xs">
            ✏️
          </span>
        </button>

        <AnimatePresence mode="wait">
          {editingName ? (
            <motion.div key="edit" className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameValue(profile.displayName); setEditingName(false) } }}
                maxLength={60}
                className="h-8 w-44 rounded-lg border border-slate-200 bg-white/70 px-2 text-center text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
              <button onClick={saveName} disabled={savingName} className="rounded-full p-1.5 text-emerald-500 hover:bg-emerald-50">
                <Check size={16} />
              </button>
            </motion.div>
          ) : (
            <motion.button key="display" className="flex items-center gap-1.5 text-lg font-semibold text-slate-800" onClick={() => setEditingName(true)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {profile.displayName}
              <Pencil size={14} className="text-slate-400" />
            </motion.button>
          )}
        </AnimatePresence>

        <p className="text-xs text-slate-400">@{profile.user.username}</p>
      </motion.div>

      {/* Household */}
      {profile.household && (
        <motion.section variants={fadeUp} className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{m.household}</h2>
          {isAdmin ? (
            <button
              onClick={() => router.push('/admin')}
              className="flex w-full items-center justify-between rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  <Home size={20} className="text-indigo-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-700">{profile.household.name}</p>
                  <p className="text-xs text-slate-400">{m.manageHousehold}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                <Home size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">{profile.household.name}</p>
            </div>
          )}
        </motion.section>
      )}

      {/* Security */}
      <motion.section variants={fadeUp} className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{m.security}</h2>
        <button
          onClick={() => setPwOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <KeyRound size={18} className="text-amber-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">{m.changePassword}</p>
          </div>
          <ChevronRight size={16} className="text-slate-300" />
        </button>
      </motion.section>

      {/* Account actions */}
      <motion.section variants={fadeUp} className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{m.account}</h2>
        <div className="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-100">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <LogOut size={16} />
            {m.signOut}
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-3.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 size={16} />
            {m.deleteAccount}
          </button>
        </div>
      </motion.section>

      {/* Avatar + Color picker dialog */}
      <Dialog open={pickerOpen} onOpenChange={(open) => { if (!open) { setPendingAvatar(profile.avatar); setPendingColor(profile.color) } setPickerOpen(open) }}>
        <DialogContent className="max-w-sm p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-slate-600">{m.editAvatar}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-8 gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setPendingAvatar(emoji)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-all',
                  pendingAvatar === emoji ? 'ring-2 ring-indigo-400 ring-offset-1 scale-110' : 'hover:bg-slate-100'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-medium text-slate-500">{m.profileColor}</p>
            <div className="flex flex-wrap gap-2">
              {PROFILE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setPendingColor(c)}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 transition-all',
                    pendingColor === c ? 'ring-2 ring-indigo-400 ring-offset-2 scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c, borderColor: pendingColor === c ? 'transparent' : '#e2e8f0' }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={savePicker}
            className="mt-1 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            {common.save}
          </button>
        </DialogContent>
      </Dialog>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onOpenChange={(open) => { setPwOpen(open); if (!open) { setCurrentPw(''); setNewPw(''); setPwError(null) } }}>
        <DialogContent className="max-w-sm p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-slate-600">{m.changePassword}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{m.currentPassword}</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">{m.newPassword}</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  minLength={8}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {pwError && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{pwError}</p>}

            <button
              onClick={changePassword}
              disabled={savingPw || !currentPw || !newPw}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {savingPw ? common.saving : common.save}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-red-600">{m.deleteAccount}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">{m.deleteConfirm}</p>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setDeleteConfirm(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
              {common.cancel}
            </button>
            <button
              onClick={deleteProfile}
              disabled={deleting}
              className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? common.loading : common.delete}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
