import { formatCurrency } from '@/lib/locale'
import { cn } from '@/lib/utils'

type MoneyProps = {
  value: number
  prefix?: string
  className?: string
}

export function Money({ value, prefix, className }: MoneyProps) {
  return (
    <span className={cn('font-brand', className)}>
      {prefix}{formatCurrency(value)}
    </span>
  )
}
