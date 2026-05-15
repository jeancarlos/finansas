'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { locale } from '@/lib/locale'

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'type' | 'inputMode'
> & {
  value: string
  onValueChange: (displayValue: string) => void
}

function maskValue(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  digits = digits.replace(/^0+/, '') || '0'
  digits = digits.padStart(3, '0')

  if (locale.lang === 'pt-BR') {
    // BRL: 1.234,56
    const intPart = digits.slice(0, -2)
    const decPart = digits.slice(-2)
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${formatted},${decPart}`
  }

  // Default (en/USD): 1,234.56
  const intPart = digits.slice(0, -2)
  const decPart = digits.slice(-2)
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${formatted}.${decPart}`
}

const EMPTY_VALUE = locale.lang === 'pt-BR' ? '0,00' : '0.00'

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskValue(e.target.value)
      onValueChange(masked === EMPTY_VALUE ? '' : masked)
    },
    [onValueChange],
  )

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      className={cn('font-brand', className)}
      {...props}
    />
  )
}
