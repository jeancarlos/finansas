import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

type Session = {
  userId: string
  profileId: string | null
  householdId: string | null
  isAdmin: boolean
}

type AuthedFn<T> = (session: Session) => Promise<T>

export async function requireAuth<T>(fn: AuthedFn<T>): Promise<T | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return fn({
    userId: session.user.id,
    profileId: session.user.profileId ?? null,
    householdId: session.user.householdId ?? null,
    isAdmin: session.user.isAdmin ?? false,
  })
}

export async function requireAdmin<T>(fn: AuthedFn<T>): Promise<T | NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return fn({
    userId: session.user.id,
    profileId: session.user.profileId ?? null,
    householdId: session.user.householdId ?? null,
    isAdmin: true,
  })
}
