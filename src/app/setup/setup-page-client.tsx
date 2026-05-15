'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SetupPageClient() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirmPassword = form.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdName: form.get('householdName'),
        adminName: form.get('adminName'),
        username: form.get('username'),
        password,
      }),
    })
    setLoading(false)

    if (res.status === 409) {
      setError('Setup already complete. Please sign in.')
      return
    }
    if (!res.ok) {
      const data = await res.json()
      setError(data?.error?.formErrors?.[0] ?? 'Invalid input')
      return
    }

    router.push('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to finansas</CardTitle>
          <CardDescription>Set up your household to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="householdName">Household name</Label>
              <Input id="householdName" name="householdName" placeholder="e.g. Our Home" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adminName">Your name</Label>
              <Input id="adminName" name="adminName" placeholder="e.g. Jean" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="e.g. jean"
                pattern="[a-z0-9_-]+"
                title="lowercase letters, numbers, _ and - only"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Create household'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
