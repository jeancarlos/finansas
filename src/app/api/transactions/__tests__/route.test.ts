// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      findMany: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { GET, POST } from '../route'
import { PATCH, DELETE } from '../[id]/route'

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>

const session = {
  user: { id: 'u1', isAdmin: false, profileId: 'p1', householdId: 'hh1' },
}

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(session)
})

// ── GET /api/transactions ──────────────────────────────────────────────────

describe('GET /api/transactions', () => {
  it('returns transactions for current month', async () => {
    const txs = [{ id: 't1', type: 'EXPENSE', amount: 50, date: new Date().toISOString() }]
    vi.mocked(prisma.transaction.findMany).mockResolvedValue(txs as never)

    const req = new Request('http://localhost/api/transactions')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(txs)
  })

  it('fetches household profiles when view=household', async () => {
    vi.mocked(prisma.profile.findMany).mockResolvedValue([{ id: 'p1' }, { id: 'p2' }] as never)
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never)

    const req = new Request('http://localhost/api/transactions?view=household')
    await GET(req)
    expect(prisma.profile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { householdId: 'hh1' } }),
    )
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ profileId: { in: ['p1', 'p2'] } }),
      }),
    )
  })

  it('filters by type when provided', async () => {
    vi.mocked(prisma.transaction.findMany).mockResolvedValue([] as never)
    const req = new Request('http://localhost/api/transactions?type=INCOME')
    await GET(req)
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'INCOME' }),
      }),
    )
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/transactions')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when no profile in session', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1', isAdmin: false, profileId: null, householdId: null } })
    const req = new Request('http://localhost/api/transactions')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})

// ── POST /api/transactions ─────────────────────────────────────────────────

describe('POST /api/transactions', () => {
  it('creates a transaction', async () => {
    const created = { id: 't1', type: 'EXPENSE', amount: 50 }
    vi.mocked(prisma.transaction.create).mockResolvedValue(created as never)

    const req = new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'EXPENSE',
        amount: 50,
        categoryId: 'cat1',
        date: new Date().toISOString(),
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(created)
  })

  it('returns 400 for invalid body', async () => {
    const req = new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ type: 'INVALID' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const req = new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})

// ── PATCH /api/transactions/[id] ────────────────────────────────────────────

describe('PATCH /api/transactions/[id]', () => {
  it('updates owned transaction', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({ id: 't1', profileId: 'p1' } as never)
    vi.mocked(prisma.transaction.update).mockResolvedValue({ id: 't1', amount: 99 } as never)

    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 99 }),
    })
    const res = await PATCH(req, makeParams('t1'))
    expect(res.status).toBe(200)
  })

  it('returns 403 for transaction owned by another profile', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({ id: 't1', profileId: 'other' } as never)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 99 }),
    })
    const res = await PATCH(req, makeParams('t1'))
    expect((res as NextResponse).status).toBe(403)
  })

  it('returns 404 for missing transaction', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null)
    const req = new Request('http://localhost', {
      method: 'PATCH',
      body: JSON.stringify({ amount: 99 }),
    })
    const res = await PATCH(req, makeParams('missing'))
    expect((res as NextResponse).status).toBe(404)
  })
})

// ── DELETE /api/transactions/[id] ───────────────────────────────────────────

describe('DELETE /api/transactions/[id]', () => {
  it('deletes owned transaction', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({ id: 't1', profileId: 'p1' } as never)
    vi.mocked(prisma.transaction.delete).mockResolvedValue({} as never)

    const res = await DELETE(new Request('http://localhost'), makeParams('t1'))
    expect(res.status).toBe(204)
  })

  it('returns 403 for transaction owned by another profile', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue({ id: 't1', profileId: 'other' } as never)
    const res = await DELETE(new Request('http://localhost'), makeParams('t1'))
    expect((res as NextResponse).status).toBe(403)
  })

  it('returns 404 for missing transaction', async () => {
    vi.mocked(prisma.transaction.findUnique).mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), makeParams('missing'))
    expect((res as NextResponse).status).toBe(404)
  })
})
