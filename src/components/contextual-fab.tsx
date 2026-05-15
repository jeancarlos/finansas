'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import { Plus, Receipt, Target, Repeat, Tag, type LucideIcon } from 'lucide-react'
import { useLocale } from '@/hooks/use-locale'

const DEFAULT_ACCENT = '#6366f1'

type RouteConfig = {
  icon: LucideIcon
  tooltip: string
  event: string
}

export function ContextualFab({ accentColor = DEFAULT_ACCENT }: { accentColor?: string }) {
  const pathname = usePathname()
  const { t } = useLocale()
  const m = t('fab')

  const routeMap = useMemo<Record<string, RouteConfig>>(() => ({
    '/': { icon: Receipt, tooltip: m.newTransaction, event: 'fab-add-transaction' },
    '/transactions': { icon: Receipt, tooltip: m.newTransaction, event: 'fab-add-transaction' },
    '/categories': { icon: Tag, tooltip: m.newCategory, event: 'fab-add-category' },
    '/recurring': { icon: Repeat, tooltip: m.newRecurring, event: 'fab-add-recurring' },
    '/goals': { icon: Target, tooltip: m.newGoal, event: 'fab-add-goal' },
  }), [m])

  const config: RouteConfig | null = useMemo(() => {
    for (const [route, cfg] of Object.entries(routeMap)) {
      if (route === '/' ? pathname === '/' : pathname.startsWith(route)) return cfg
    }
    return null
  }, [routeMap, pathname])

  const [showTooltip, setShowTooltip] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPress = useRef(false)
  const prevEvent = useRef<string | null>(null)
  const buttonControls = useAnimationControls()

  // Pulse when icon changes (route transition)
  useEffect(() => {
    const currentEvent = config?.event ?? null
    if (prevEvent.current !== null && currentEvent !== null && prevEvent.current !== currentEvent) {
      buttonControls.start({
        scale: [1, 0.75, 1.1, 1],
        transition: { duration: 0.35, times: [0, 0.3, 0.7, 1], ease: 'easeInOut' },
      })
    }
    prevEvent.current = currentEvent
  }, [config?.event, buttonControls])

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handlePointerDown = useCallback(() => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      setShowTooltip(true)
    }, 500)
  }, [])

  const handlePointerUp = useCallback(() => {
    clearTimer()
    if (isLongPress.current) {
      setTimeout(() => setShowTooltip(false), 1200)
    }
  }, [clearTimer])

  const handleClick = useCallback(() => {
    if (isLongPress.current) return
    if (config) {
      window.dispatchEvent(new CustomEvent(config.event))
    }
  }, [config])

  const handlePointerLeave = useCallback(() => {
    clearTimer()
    setShowTooltip(false)
  }, [clearTimer])

  const isVisible = !!config

  return (
    <motion.div
      className="relative flex items-center justify-center overflow-visible"
      animate={{
        width: isVisible ? 48 : 0,
        marginLeft: isVisible ? 10 : 0,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && config && (
          <motion.div
            className="pointer-events-none absolute bottom-full mb-3 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
            style={{ backgroundColor: accentColor }}
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {config.tooltip}
            <div
              className="absolute left-1/2 top-full -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `6px solid ${accentColor}`,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      {config && (
        <motion.button
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-lg"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 4px 20px ${accentColor}40`,
          }}
          animate={buttonControls}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
          onContextMenu={(e) => e.preventDefault()}
          aria-label={config.tooltip}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={config.event}
              className="flex items-center justify-center text-white"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {(() => { const Icon = config.icon; return <Icon size={20} /> })()}
            </motion.span>
          </AnimatePresence>
          {/* Plus badge */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
            <Plus size={11} style={{ color: accentColor }} strokeWidth={3} />
          </span>
        </motion.button>
      )}
    </motion.div>
  )
}
