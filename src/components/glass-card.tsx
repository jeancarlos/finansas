'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type GlassCardProps = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  hoverable?: boolean
}

export function GlassCard({ children, className, style, onClick, hoverable = true }: GlassCardProps) {
  return (
    <motion.div
      className={cn('glass-card p-4 sm:p-6', hoverable && 'cursor-pointer', className)}
      style={style}
      whileHover={hoverable ? { scale: 1.02 } : undefined}
      whileTap={hoverable && onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
