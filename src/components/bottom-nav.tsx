'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ArrowLeftRight, RefreshCw, Target, TrendingUp, Settings } from 'lucide-react'
import { useProfile } from '@/hooks/use-profile'
import { useLocale } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

export function BottomNav() {
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
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-background">
      <ul className="flex h-16 items-center justify-around px-2">
        {items.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
