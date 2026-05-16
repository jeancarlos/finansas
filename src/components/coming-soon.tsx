'use client'

import { type LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocale } from '@/hooks/use-locale'

type NavKey = 'recurring' | 'goals' | 'projections'

export function ComingSoon({ icon: Icon, titleKey }: { icon: LucideIcon; titleKey: NavKey }) {
  const { t } = useLocale()

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 py-24 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Icon size={28} className="text-slate-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-slate-700">{t('nav')[titleKey]}</p>
        <p className="mt-1 text-sm text-slate-400">{t('common').comingSoon}</p>
      </div>
    </motion.div>
  )
}
