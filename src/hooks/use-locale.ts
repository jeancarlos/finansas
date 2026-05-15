'use client'

import { locale, t, formatCurrency, formatDate, formatDateOnly } from '@/lib/locale'

export function useLocale() {
  return { ...locale, t, formatCurrency, formatDate, formatDateOnly }
}
