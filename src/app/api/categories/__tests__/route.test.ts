// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GET, POST } from '../route'
import { DELETE } from '../[id]/route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>

const session = {
  user: { id: 'user-1', isAdmin: false, profileId: 'profile-1', householdId: 'hh-1' },
}

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(session)
})

// ── GET /api/categories ─────────────────────────────────────────────────────

describe('GET /api/categories', () => {
  it('returns categories for profile', async () => {
    const cats = [{ id: 'c1', name: 'Food', icon: 'UtensilsCrossed', color: '#f97316', type: 'EXPENSE' }]
    vi.mocked(prisma.category.findMany).mockResolvedValue(cats as never)

    const req = new Request('http://localhost/api/categories')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(cats)
  })

  it('filters by type when provided', async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([] as never)
    const req = new Request('http://localhost/api/categories?type=EXPENSE')
    await GET(req)
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ type: 'EXPENSE' }) }),
    )
  })

  it('returns 400 when no profileId in session', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', isAdmin: false, profileId: null, householdId: null } })
    const req = new Request('http://localhost/api/categories')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/categories')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})

// ── POST /api/categories ────────────────────────────────────────────────────

describe('POST /api/categories', () => {
  it('creates a category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    const created = { id: 'c1', name: 'Housing', icon: 'Home', color: '#6366f1', type: 'EXPENSE' }
    vi.mocked(prisma.category.create).mockResolvedValue(created as never)

    const req = new Request('http://localhost/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Housing', icon: 'Home', color: '#6366f1', type: 'EXPENSE' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(created)
  })

  it('returns 409 when name+type already exists', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'c1' } as never)
    const req = new Request('http://localhost/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Food', type: 'EXPENSE' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('returns 400 for invalid body', async () => {
    const req = new Request('http://localhost/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'X' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('defaults icon and color when omitted', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.category.create).mockResolvedValue({} as never)

    const req = new Request('http://localhost/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Misc', type: 'EXPENSE' }),
    })
    await POST(req)
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ icon: 'Circle', color: '#6b7280' }),
      }),
    )
  })
})

// ── DELETE /api/categories/[id] ─────────────────────────────────────────────

describe('DELETE /api/categories/[id]', () => {
  it('deletes category owned by profile', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ profileId: 'profile-1' } as never)
    vi.mocked(prisma.category.delete).mockResolvedValue({} as never)

    const res = await DELETE(new Request('http://localhost'), makeParams('c1'))
    expect(res.status).toBe(204)
  })

  it('returns 403 for category owned by another profile', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ profileId: 'other-profile' } as never)
    const res = await DELETE(new Request('http://localhost'), makeParams('c1'))
    expect(res.status).toBe(403)
  })

  it('returns 404 for missing category', async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeParams('missing'))
    expect(res.status).toBe(404)
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeParams('c1'))
    expect(res.status).toBe(401)
  })
})
