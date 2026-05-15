'use client'

import { BottomNav } from './bottom-nav'
import { ContextualFab } from './contextual-fab'
import { useProfile } from '@/hooks/use-profile'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profileColor } = useProfile()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-28">
      {/* Top gradient — subtle fade from status bar into page content */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-10 h-4"
        style={{ background: 'linear-gradient(to bottom, #f8fafc 0%, transparent 100%)' }}
      />
      <main
        className="relative mx-auto max-w-lg px-4 pb-6"
        style={{
          paddingTop: 'calc(1rem + env(safe-area-inset-top))',
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        }}
      >
        {children}
      </main>

      {/* Bottom bar backdrop blur — visual only */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28"
        style={{
          background:
            'linear-gradient(to top, rgba(249, 250, 251, 0.85) 0%, rgba(249, 250, 251, 0.5) 50%, transparent 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          maskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 40%, transparent 100%)',
        }}
      />
      {/* Nav pill */}
      <div
        className="fixed bottom-5 z-40 mx-auto flex max-w-lg items-center"
        style={{
          left: 'max(1rem, env(safe-area-inset-left, 0px))',
          right: 'max(1rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <BottomNav accentColor={profileColor} />
        <ContextualFab accentColor={profileColor} />
      </div>
    </div>
  )
}
