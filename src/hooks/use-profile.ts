'use client'

import { useSession } from 'next-auth/react'

export function useProfile() {
  const { data: session } = useSession()
  return {
    userId: session?.user?.id ?? null,
    profileId: session?.user?.profileId ?? null,
    householdId: session?.user?.householdId ?? null,
    isAdmin: session?.user?.isAdmin ?? false,
    profileColor: session?.user?.profileColor ?? '#6366f1',
    profileAvatar: session?.user?.profileAvatar ?? '',
  }
}
