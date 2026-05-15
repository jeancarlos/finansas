'use client'

import { useState, useTransition } from 'react'
import { PROFILE_COLORS, DEFAULT_PROFILE_COLOR } from '@/lib/profile-colors'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLocale } from '@/hooks/use-locale'

type User = {
  id: string
  username: string
  name: string | null
  isAdmin: boolean
}

type Profile = {
  id: string
  displayName: string
  avatar: string
  color: string
  user: { id: string; username: string; name: string | null }
}

type Props = {
  household: { id: string; name: string }
  users: User[]
  profiles: Profile[]
  currentUserId: string
}

export function AdminPageClient({ household, users, profiles, currentUserId }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const { t } = useLocale()
  const m = t('admin')

  const refresh = () => startTransition(() => router.refresh())

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{m.title}</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{m.users}</TabsTrigger>
          <TabsTrigger value="profiles">{m.profiles}</TabsTrigger>
          <TabsTrigger value="household">{m.household}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 pt-4">
          <UsersTab users={users} currentUserId={currentUserId} onMutate={refresh} />
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4 pt-4">
          <ProfilesTab profiles={profiles} users={users} onMutate={refresh} />
        </TabsContent>

        <TabsContent value="household" className="space-y-4 pt-4">
          <HouseholdTab household={household} onMutate={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Users tab ──────────────────────────────────────────────────────────────

function UsersTab({
  users,
  currentUserId,
  onMutate,
}: {
  users: User[]
  currentUserId: string
  onMutate: () => void
}) {
  const [open, setOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const { t } = useLocale()
  const m = t('admin')

  async function handleDelete(id: string) {
    if (!confirm(m.confirmDeleteUser)) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    onMutate()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{m.usersCount(users.length)}</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button size="sm" onClick={() => setOpen(true)}>{m.newUser}</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{m.createUser}</DialogTitle>
            </DialogHeader>
            <CreateUserForm
              onSuccess={() => {
                setOpen(false)
                onMutate()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{u.username}</span>
              {u.name && <span className="text-sm text-muted-foreground">{u.name}</span>}
              {u.isAdmin && <Badge variant="secondary">{m.adminBadge}</Badge>}
              {u.id === currentUserId && <Badge variant="outline">{m.youBadge}</Badge>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setResetTarget(u)}>
                {m.resetPassword}
              </Button>
              {u.id !== currentUserId && (
                <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id)}>
                  {t('common').delete}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.resetPassword} — {resetTarget?.username}</DialogTitle>
          </DialogHeader>
          {resetTarget && (
            <ResetPasswordForm
              userId={resetTarget.id}
              onSuccess={() => {
                setResetTarget(null)
                onMutate()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [pending, startTransition] = useTransition()
  const { t } = useLocale()
  const m = t('admin')
  const c = t('common')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const body = {
      username: fd.get('username'),
      name: fd.get('name') || undefined,
      password: fd.get('password'),
      isAdmin,
    }
    startTransition(async () => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error?.toString() ?? c.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cu-username">{m.username}</Label>
        <Input id="cu-username" name="username" required minLength={3} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cu-name">{m.displayNameOptional}</Label>
        <Input id="cu-name" name="name" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cu-password">{m.password}</Label>
        <Input id="cu-password" name="password" type="password" required minLength={8} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="cu-isAdmin"
          checked={isAdmin}
          onCheckedChange={(v) => setIsAdmin(v === true)}
        />
        <Label htmlFor="cu-isAdmin">{m.isAdmin}</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? c.creating : m.createUser}
      </Button>
    </form>
  )
}

function ResetPasswordForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const { t } = useLocale()
  const m = t('admin')
  const c = t('common')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: fd.get('password') }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        setError(c.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="rp-password">{m.newPassword}</Label>
        <Input id="rp-password" name="password" type="password" required minLength={8} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? c.saving : m.resetPassword}
      </Button>
    </form>
  )
}

// ── Profiles tab ───────────────────────────────────────────────────────────

function ProfilesTab({
  profiles,
  users,
  onMutate,
}: {
  profiles: Profile[]
  users: User[]
  onMutate: () => void
}) {
  const [open, setOpen] = useState(false)
  const { t } = useLocale()
  const m = t('admin')
  const c = t('common')

  async function handleDelete(id: string) {
    if (!confirm(m.confirmDeleteProfile)) return
    await fetch(`/api/admin/profiles/${id}`, { method: 'DELETE' })
    onMutate()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{m.profilesCount(profiles.length)}</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button size="sm" onClick={() => setOpen(true)}>{m.newProfile}</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{m.createProfile}</DialogTitle>
            </DialogHeader>
            <CreateProfileForm
              users={users}
              onSuccess={() => {
                setOpen(false)
                onMutate()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <ul className="space-y-2">
        {profiles.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.avatar || p.displayName[0].toUpperCase()}
              </div>
              <div>
                <span className="font-medium">{p.displayName}</span>
                <span className="ml-2 text-sm text-muted-foreground">@{p.user.username}</span>
              </div>
            </div>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
              {c.delete}
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}

function CreateProfileForm({
  users,
  onSuccess,
}: {
  users: User[]
  onSuccess: () => void
}) {
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const [userId, setUserId] = useState('')
  const [color, setColor] = useState<string>(DEFAULT_PROFILE_COLOR)
  const { t } = useLocale()
  const m = t('admin')
  const c = t('common')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await fetch('/api/admin/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: fd.get('displayName'),
          avatar: fd.get('avatar') || '',
          color,
          userId,
        }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error?.toString() ?? c.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cp-displayName">{m.displayName}</Label>
        <Input id="cp-displayName" name="displayName" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cp-avatar">{m.avatar}</Label>
        <Input
          id="cp-avatar"
          name="avatar"
          placeholder="😀"
          maxLength={4}
          className="w-24 text-center text-xl"
        />
      </div>
      <div className="space-y-1">
        <Label>{m.color}</Label>
        <div className="flex flex-wrap gap-2">
          {PROFILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                outline: color === c ? `3px solid ${c}` : undefined,
                outlineOffset: color === c ? '2px' : undefined,
              }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <div className="space-y-1">
        <Label id="cp-user-label" htmlFor="cp-user-trigger">{m.user}</Label>
        <Select value={userId} onValueChange={(v) => setUserId(v ?? '')} required>
          <SelectTrigger id="cp-user-trigger" aria-labelledby="cp-user-label">
            <SelectValue placeholder={m.selectUser} />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.username}{u.name ? ` — ${u.name}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending || !userId}>
        {pending ? c.creating : m.createProfile}
      </Button>
    </form>
  )
}

// ── Household tab ──────────────────────────────────────────────────────────

function HouseholdTab({
  household,
  onMutate,
}: {
  household: { id: string; name: string }
  onMutate: () => void
}) {
  const [name, setName] = useState(household.name)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const { t } = useLocale()
  const m = t('admin')
  const c = t('common')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      const res = await fetch('/api/admin/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        onMutate()
      } else {
        setError(c.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <Label htmlFor="hh-name">{m.householdName}</Label>
        <Input
          id="hh-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? c.saving : c.save}
      </Button>
    </form>
  )
}
