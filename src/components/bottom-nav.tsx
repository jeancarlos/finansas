'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, RefreshCw, Target, TrendingUp, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProfile } from '@/hooks/use-profile'
import { useLocale } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

const DEFAULT_ACCENT = '#6366f1'

export function BottomNav({ accentColor = DEFAULT_ACCENT }: { accentColor?: string }) {
  const pathname = usePathname()
  const { isAdmin } = useProfile()
  const { t } = useLocale()
  const nav = t('nav')

  const NAV_ITEMS = [
    { href: '/', icon: Home, label: nav.home },
    { href: '/transactions', icon: ArrowLeftRight, label: nav.transactions },
    { href: '/recurring', icon: RefreshCw, label: nav.recurring },
    { href: '/goals', icon: Target, label: nav.goals },
    { href: '/projections', icon: TrendingUp, label: nav.projections },
  ]

  const items = isAdmin
    ? [...NAV_ITEMS, { href: '/admin', icon: Settings, label: nav.admin }]
    : NAV_ITEMS

  return (
    <div
      className="flex flex-1 items-center gap-0.5 rounded-full px-1.5 py-1.5"
      style={{
        background: 'rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow:
          '0 8px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      }}
      role="navigation"
    >
      {items.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[10px] font-medium transition-all',
              active ? 'font-semibold' : 'text-slate-400'
            )}
            style={active ? { color: accentColor } : undefined}
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: accentColor + '18',
                  boxShadow: `0 0 12px ${accentColor}15`,
                }}
                layoutId="nav-pill"
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              />
            )}
            <span className="relative z-10">
              <Icon size={20} />
            </span>
            <span className="relative z-10 max-w-full truncate">{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
