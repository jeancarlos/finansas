'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Checkbox } from '@/components/ui/checkbox'

type User = {
  id: string
  username: string
  name: string | null
  isAdmin: boolean
}

type Profile = {
  id: string
  displayName: string
  avatar: string | null
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

  const refresh = () => startTransition(() => router.refresh())

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="household">Household</TabsTrigger>
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

  async function handleDelete(id: string) {
    if (!confirm('Delete this user and all their data?')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    onMutate()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{users.length} users</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button size="sm" onClick={() => setOpen(true)}>New user</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
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
              {u.isAdmin && <Badge variant="secondary">admin</Badge>}
              {u.id === currentUserId && <Badge variant="outline">you</Badge>}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResetTarget(u)}
              >
                Reset password
              </Button>
              {u.id !== currentUserId && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(u.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password — {resetTarget?.username}</DialogTitle>
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
        setError(data.error?.toString() ?? 'Error creating user')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cu-username">Username</Label>
        <Input id="cu-username" name="username" required minLength={3} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cu-name">Display name (optional)</Label>
        <Input id="cu-name" name="name" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cu-password">Password</Label>
        <Input id="cu-password" name="password" type="password" required minLength={8} />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="cu-isAdmin"
          checked={isAdmin}
          onCheckedChange={(v) => setIsAdmin(v === true)}
        />
        <Label htmlFor="cu-isAdmin">Admin</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating…' : 'Create user'}
      </Button>
    </form>
  )
}

function ResetPasswordForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

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
        setError('Failed to reset password')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="rp-password">New password</Label>
        <Input id="rp-password" name="password" type="password" required minLength={8} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Saving…' : 'Reset password'}
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

  async function handleDelete(id: string) {
    if (!confirm('Delete this profile and all its data?')) return
    await fetch(`/api/admin/profiles/${id}`, { method: 'DELETE' })
    onMutate()
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{profiles.length} profiles</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button size="sm" onClick={() => setOpen(true)}>New profile</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create profile</DialogTitle>
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
            <div>
              <span className="font-medium">{p.displayName}</span>
              <span className="ml-2 text-sm text-muted-foreground">@{p.user.username}</span>
            </div>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
              Delete
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await fetch('/api/admin/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: fd.get('displayName'), userId }),
      })
      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        setError(data.error?.toString() ?? 'Error creating profile')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="cp-displayName">Display name</Label>
        <Input id="cp-displayName" name="displayName" required />
      </div>
      <div className="space-y-1">
        <Label id="cp-user-label" htmlFor="cp-user-trigger">User</Label>
        <Select value={userId} onValueChange={(v) => setUserId(v ?? '')} required>
          <SelectTrigger id="cp-user-trigger" aria-labelledby="cp-user-label">
            <SelectValue placeholder="Select user…" />
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
        {pending ? 'Creating…' : 'Create profile'}
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
        setError('Failed to save')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div className="space-y-1">
        <Label htmlFor="hh-name">Household name</Label>
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
        {pending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
