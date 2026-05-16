'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useLocale } from '@/hooks/use-locale'
import { useInitialAnimation } from '@/hooks/use-initial-animation'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function LoginPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get('callbackUrl') || '/'
  const callbackUrl = rawCallback.startsWith('/') && !rawCallback.startsWith('//') ? rawCallback : '/'
  const shouldAnimate = useInitialAnimation()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { t } = useLocale()
  const m = t('login')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      username: form.get('username'),
      password: form.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError(m.invalid)
      return
    }
    router.push(callbackUrl)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#c8d8ed] md:bg-slate-100 md:p-6">
      {/* Top gradient */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[5] h-12 md:hidden"
        style={{ background: 'linear-gradient(to bottom, #c8d8ed 0%, transparent 100%)' }}
      />

      <div className="relative flex min-h-dvh w-full flex-col items-center justify-end overflow-hidden bg-[#c8d8ed] md:min-h-0 md:max-w-md md:rounded-3xl md:shadow-xl">
        <Image
          src="/images/pigui-app-financeiro-mobile.png"
          alt=""
          fill
          priority
          className="object-cover object-top"
        />

        <motion.div
          className="relative z-10 flex w-full flex-col items-center gap-5 px-8 pt-96 pb-12"
          initial={shouldAnimate ? 'hidden' : false}
          animate="show"
          transition={{ staggerChildren: 0.15, delayChildren: 0.3 }}
        >
          <motion.div variants={fadeUp} className="text-center">
            <h1 className="font-brand text-3xl font-extrabold tracking-tight text-slate-800">Finansas</h1>
            <p className="mt-1.5 text-slate-500">{m.title}</p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="w-full rounded-2xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="username" className="text-xs font-medium text-slate-600">
                  {m.username}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-xs font-medium text-slate-600">
                  {m.password}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/70 px-5 py-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                {loading ? '…' : m.submit}
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
