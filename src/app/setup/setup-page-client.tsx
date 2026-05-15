'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Home, User } from 'lucide-react'
import { useLocale } from '@/hooks/use-locale'
import { useInitialAnimation } from '@/hooks/use-initial-animation'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

export function SetupPageClient() {
  const router = useRouter()
  const shouldAnimate = useInitialAnimation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { t } = useLocale()
  const m = t('setup')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirmPassword = form.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError(m.passwordMismatch)
      return
    }

    setLoading(true)
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdName: form.get('householdName'),
        adminName: form.get('adminName'),
        username: form.get('username'),
        password,
      }),
    })
    setLoading(false)

    if (res.status === 409) {
      setError('Setup already complete. Please sign in.')
      return
    }
    if (!res.ok) {
      const data = await res.json()
      setError(data?.error?.formErrors?.[0] ?? t('common').error)
      return
    }

    router.push('/login')
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#dce8f3' }}>
      {/* Top gradient */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[15] h-12"
        style={{ background: 'linear-gradient(to bottom, #f8fafc 0%, transparent 100%)' }}
      />

      {/* Hero image */}
      <motion.div
        className="relative md:flex md:justify-center md:pt-6"
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 hidden md:block"
          style={{
            background:
              'radial-gradient(ellipse 70% 90% at 50% 35%, #f0f5fa 0%, #d6e6f2 50%, #dce8f3 100%)',
          }}
        />

        {/* Header overlay */}
        <div className="absolute inset-x-0 top-0 z-20 mx-auto max-w-lg px-4 pt-8">
          <h1 className="font-brand text-3xl font-extrabold tracking-tight text-slate-800">{t('brand').name}</h1>
          <p className="text-sm text-slate-500">{t('brand').subtitle}</p>
        </div>

        <Image
          src="/images/pigui-financas-compartilhadas-familia.png"          alt=""
          width={2752}
          height={1536}
          priority
          className="relative z-10 h-auto w-full object-cover md:max-w-lg md:rounded-2xl"
          style={{
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          }}
        />
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <motion.div
          className="relative z-20 mx-auto -mt-10 max-w-lg space-y-6 px-4 pb-10"
          variants={stagger}
          initial={shouldAnimate ? 'hidden' : false}
          animate="show"
        >
          {/* Household section */}
          <motion.section variants={fadeUp} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('admin').household}
            </h2>

            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <Home size={18} className="text-indigo-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <label htmlFor="householdName" className="text-sm font-medium text-slate-700">
                    {m.householdName}
                  </label>
                  <input
                    id="householdName"
                    name="householdName"
                    type="text"
                    placeholder={m.householdNamePlaceholder}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Admin section */}
          <motion.section variants={fadeUp} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('admin').title}
            </h2>

            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                  <User size={18} className="text-violet-500" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="adminName" className="text-sm font-medium text-slate-700">
                      {m.adminName}
                    </label>
                    <input
                      id="adminName"
                      name="adminName"
                      type="text"
                      placeholder={m.adminNamePlaceholder}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="username" className="text-sm font-medium text-slate-700">
                      {m.username}
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder={m.usernamePlaceholder}
                      pattern="[a-z0-9_\-]+"
                      title="lowercase letters, numbers, _ and - only"
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                      {m.password}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      minLength={8}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                      {m.confirmPassword}
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      minLength={8}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {error && (
            <motion.p
              variants={fadeUp}
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100"
            >
              {error}
            </motion.p>
          )}

          <motion.div variants={fadeUp}>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t('common').creating}
                </>
              ) : (
                m.submit
              )}
            </button>
          </motion.div>
        </motion.div>
      </form>
    </div>
  )
}
