'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'
import { getLucideIcon } from '@/lib/icons'
import { useLocale } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
  type: string
}

type Props = {
  categories: Category[]
}

export function CategoriesPageClient({ categories: initial }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { t } = useLocale()
  const m = t('categories')
  const c = t('common')

  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')

  // Listen for FAB event
  useEffect(() => {
    const handler = () => setShowForm(true)
    window.addEventListener('fab-add-category', handler)
    return () => window.removeEventListener('fab-add-category', handler)
  }, [])

  const refresh = () => startTransition(() => router.refresh())

  const expenses = initial.filter((c) => c.type === 'EXPENSE')
  const income = initial.filter((c) => c.type === 'INCOME')

  async function handleDelete(id: string) {
    if (!confirm(m.confirmDelete)) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    refresh()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{m.title}</h1>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'EXPENSE' | 'INCOME')}
      >
        <TabsList>
          <TabsTrigger value="EXPENSE">{m.expenses}</TabsTrigger>
          <TabsTrigger value="INCOME">{m.income}</TabsTrigger>
        </TabsList>

        <TabsContent value="EXPENSE" className="space-y-2 pt-4">
          <CategoryList categories={expenses} onDelete={handleDelete} deleteLabel={c.delete} emptyLabel={m.noCategories} />
        </TabsContent>

        <TabsContent value="INCOME" className="space-y-2 pt-4">
          <CategoryList categories={income} onDelete={handleDelete} deleteLabel={c.delete} emptyLabel={m.noCategories} />
        </TabsContent>
      </Tabs>

      {showForm && (
        <AddCategoryForm
          type={activeTab}
          onSuccess={() => { setShowForm(false); refresh() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          + {m.newCategory}
        </Button>
      )}
    </div>
  )
}

function CategoryList({
  categories,
  onDelete,
  deleteLabel,
  emptyLabel,
}: {
  categories: Category[]
  onDelete: (id: string) => void
  deleteLabel: string
  emptyLabel: string
}) {
  if (categories.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-1">
      {categories.map((cat) => {
        const Icon = getLucideIcon(cat.icon ?? 'Circle')
        const color = cat.color ?? '#6b7280'
        return (
          <li
            key={cat.id}
            className="flex items-center gap-3 rounded-lg border px-3 py-2"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: color + '18', color }}
            >
              <Icon size={16} />
            </div>
            <span className="flex-1 text-sm font-medium">{cat.name}</span>
            <button
              onClick={() => onDelete(cat.id)}
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label={deleteLabel}
            >
              <Trash2 size={15} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function AddCategoryForm({
  type,
  onSuccess,
  onCancel,
}: {
  type: 'EXPENSE' | 'INCOME'
  onSuccess: () => void
  onCancel: () => void
}) {
  const { t } = useLocale()
  const m = t('categories')
  const c = t('common')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const [icon, setIcon] = useState('Circle')
  const [color, setColor] = useState('#6b7280')

  const Icon = getLucideIcon(icon)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string).trim()
    setError('')

    startTransition(async () => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, color, type }),
      })
      if (res.ok) {
        onSuccess()
      } else if (res.status === 409) {
        setError(m.nameTaken)
      } else {
        setError(c.error)
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border bg-card p-4"
    >
      <div className="space-y-1">
        <Label htmlFor="cat-name">{m.name}</Label>
        <Input id="cat-name" name="name" required autoFocus />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <Label htmlFor="cat-icon">{m.icon}</Label>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: color + '18', color }}
            >
              <Icon size={16} />
            </div>
            <Input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value || 'Circle')}
              placeholder="Circle"
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cat-color">{m.color}</Label>
          <div className="flex items-center gap-2">
            <input
              id="cat-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border bg-background p-1"
            />
            <span className={cn('font-mono text-xs text-muted-foreground')}>{color}</span>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          {c.cancel}
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? c.creating : c.create}
        </Button>
      </div>
    </form>
  )
}
