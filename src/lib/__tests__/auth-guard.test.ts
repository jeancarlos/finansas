// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { auth } from '@/lib/auth'
import { requireAuth, requireAdmin } from '@/lib/auth-guard'

// NextAuth v5 exports auth as a middleware wrapper — cast to vi.fn for testing
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>

beforeEach(() => vi.clearAllMocks())

describe('requireAuth', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await requireAuth(async () => 'ok')
    expect(res).toBeInstanceOf(NextResponse)
    expect((res as NextResponse).status).toBe(401)
  })

  it('calls fn with session data when authenticated', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', profileId: 'p1', householdId: 'h1', isAdmin: false, email: '' },
      expires: '',
    })
    const fn = vi.fn().mockResolvedValue('result')
    const result = await requireAuth(fn)
    expect(fn).toHaveBeenCalledWith({
      userId: 'u1',
      profileId: 'p1',
      householdId: 'h1',
      isAdmin: false,
    })
    expect(result).toBe('result')
  })
})

describe('requireAdmin', () => {
  it('returns 401 when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await requireAdmin(async () => 'ok')
    expect((res as NextResponse).status).toBe(401)
  })

  it('returns 403 when authenticated but not admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', profileId: 'p1', householdId: 'h1', isAdmin: false, email: '' },
      expires: '',
    })
    const res = await requireAdmin(async () => 'ok')
    expect((res as NextResponse).status).toBe(403)
  })

  it('calls fn when admin', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u1', profileId: 'p1', householdId: 'h1', isAdmin: true, email: '' },
      expires: '',
    })
    const fn = vi.fn().mockResolvedValue('result')
    await requireAdmin(fn)
    expect(fn).toHaveBeenCalledWith({
      userId: 'u1',
      profileId: 'p1',
      householdId: 'h1',
      isAdmin: true,
    })
  })
})
