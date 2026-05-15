'use client'

import { useState } from 'react'

/**
 * Returns true only on the first page render of the session.
 * Subsequent navigations return false so framer-motion skips entrance animations.
 * On the server always returns false so SSR never renders opacity:0 inline styles.
 *
 * Usage: <motion.div initial={shouldAnimate ? "hidden" : false} animate="show">
 */
export function useInitialAnimation(): boolean {
  const [shouldAnimate] = useState(() => {
    if (typeof window === 'undefined') return false
    const key = 'app-animated'
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1')
      return true
    }
    return false
  })
  return shouldAnimate
}
