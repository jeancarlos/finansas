// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    household: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    category: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GET as getUsers, POST as createUser } from '../users/route'
import { PATCH as resetPassword, DELETE as deleteUser } from '../users/[id]/route'
import { GET as getProfiles, POST as createProfile } from '../profiles/route'
import { DELETE as deleteProfile } from '../profiles/[id]/route'
import { PATCH as updateHousehold } from '../household/route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>

const adminSession = {
  user: { id: 'admin-id', isAdmin: true, profileId: null, householdId: 'hh-1' },
}

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
})

// ── Users ──────────────────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('returns user list', async () => {
    const users = [{ id: '1', username: 'alice', name: null, isAdmin: false }]
    vi.mocked(prisma.user.findMany).mockResolvedValue(users as never)
    const res = await getUsers()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(users)
  })

  it('returns 403 for non-admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'x', isAdmin: false } })
    const res = await getUsers()
    expect((res as NextResponse).status).toBe(403)
  })
})

describe('POST /api/admin/users', () => {
  it('creates a user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const created = { id: '2', username: 'bob', name: null, isAdmin: false }
    vi.mocked(prisma.user.create).mockResolvedValue(created as never)

    const req = new Request('http://x', {
      method: 'POST',
      body: JSON.stringify({ username: 'bob', password: 'secret123' }),
    })
    const res = await createUser(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(created)
  })

  it('returns 409 if username taken', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'x' } as never)
    const req = new Request('http://x', {
      method: 'POST',
      body: JSON.stringify({ username: 'alice', password: 'secret123' }),
    })
    const res = await createUser(req)
    expect((res as NextResponse).status).toBe(409)
  })

  it('returns 400 for invalid body', async () => {
    const req = new Request('http://x', {
      method: 'POST',
      body: JSON.stringify({ username: 'ab', password: 'short' }),
    })
    const res = await createUser(req)
    expect((res as NextResponse).status).toBe(400)
  })
})

describe('PATCH /api/admin/users/[id]', () => {
  it('resets password', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)
    const req = new Request('http://x', {
      method: 'PATCH',
      body: JSON.stringify({ password: 'newpassword1' }),
    })
    const res = await resetPassword(req, makeParams('user-1'))
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/admin/users/[id]', () => {
  it('deletes a user', async () => {
    vi.mocked(prisma.user.delete).mockResolvedValue({} as never)
    const res = await deleteUser(new Request('http://x'), makeParams('other-id'))
    expect((res as NextResponse).status).toBe(204)
  })

  it('returns 400 when deleting self', async () => {
    const res = await deleteUser(new Request('http://x'), makeParams('admin-id'))
    expect((res as NextResponse).status).toBe(400)
  })
})

// ── Profiles ───────────────────────────────────────────────────────────────

describe('GET /api/admin/profiles', () => {
  it('returns profile list', async () => {
    const profiles = [{ id: 'p1', displayName: 'Alice', user: { username: 'alice' } }]
    vi.mocked(prisma.profile.findMany).mockResolvedValue(profiles as never)
    const res = await getProfiles()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(profiles)
  })
})

describe('POST /api/admin/profiles', () => {
  it('creates a profile', async () => {
    vi.mocked(prisma.household.findFirst).mockResolvedValue({ id: 'hh-1', name: 'Home' } as never)
    const created = { id: 'p2', displayName: 'Bob', user: { username: 'bob' } }
    vi.mocked(prisma.profile.create).mockResolvedValue(created as never)

    const req = new Request('http://x', {
      method: 'POST',
      body: JSON.stringify({ displayName: 'Bob', userId: 'cldabc123456789012345678' }),
    })
    const res = await createProfile(req)
    expect(res.status).toBe(201)
  })

  it('returns 400 for invalid body', async () => {
    const req = new Request('http://x', {
      method: 'POST',
      body: JSON.stringify({ displayName: '' }),
    })
    const res = await createProfile(req)
    expect((res as NextResponse).status).toBe(400)
  })
})

describe('DELETE /api/admin/profiles/[id]', () => {
  it('deletes a profile', async () => {
    vi.mocked(prisma.profile.delete).mockResolvedValue({} as never)
    const res = await deleteProfile(new Request('http://x'), makeParams('p1'))
    expect((res as NextResponse).status).toBe(204)
  })
})

// ── Household ──────────────────────────────────────────────────────────────

describe('PATCH /api/admin/household', () => {
  it('renames the household', async () => {
    vi.mocked(prisma.household.findFirst).mockResolvedValue({ id: 'hh-1', name: 'Old' } as never)
    vi.mocked(prisma.household.update).mockResolvedValue({ id: 'hh-1', name: 'New' } as never)
    const req = new Request('http://x', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New' }),
    })
    const res = await updateHousehold(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'hh-1', name: 'New' })
  })

  it('returns 400 for empty name', async () => {
    const req = new Request('http://x', {
      method: 'PATCH',
      body: JSON.stringify({ name: '' }),
    })
    const res = await updateHousehold(req)
    expect((res as NextResponse).status).toBe(400)
  })
})
