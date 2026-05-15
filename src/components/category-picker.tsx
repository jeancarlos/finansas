'use client'

import React, { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLucideIcon } from '@/lib/icons'
import { useLocale } from '@/hooks/use-locale'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type PickerCategory = {
  id: string
  name: string
  icon: string | null
  color: string | null
}

type CategoryPickerProps = {
  categories: PickerCategory[]
  value: string
  onChange: (categoryId: string) => void
  className?: string
}

export function CategoryPicker({ categories, value, onChange, className }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const { t } = useLocale()
  const m = t('categories')

  const selected = categories.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <div
          role="button"
          className={cn(
            'flex w-full items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-100',
            !selected && 'text-slate-400',
            className,
          )}
        >
          {selected ? (
            <>
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: (selected.color ?? '#6b7280') + '18',
                  color: selected.color ?? '#6b7280',
                }}
              >
                {React.createElement(getLucideIcon(selected.icon ?? 'Circle'), { size: 14 })}
              </div>
              <span className="flex-1 text-slate-700">{selected.name}</span>
            </>
          ) : (
            <span className="flex-1">{m.selectCategory}</span>
          )}
          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="z-[200] w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={m.searchCategory} />
          <CommandList>
            <CommandEmpty>{m.noResults}</CommandEmpty>
            <CommandGroup>
              {categories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.name}
                  onSelect={() => {
                    onChange(cat.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: (cat.color ?? '#6b7280') + '18',
                      color: cat.color ?? '#6b7280',
                    }}
                  >
                    {React.createElement(getLucideIcon(cat.icon ?? 'Circle'), { size: 14 })}
                  </div>
                  <span className="flex-1">{cat.name}</span>
                  {value === cat.id && <Check size={16} className="shrink-0 text-slate-600" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
