// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }))

import { prisma } from '@/lib/db'
import { GET, POST } from '../route'

const mockCount = vi.mocked(prisma.user.count)
const mockTx = vi.mocked(prisma.$transaction)

beforeEach(() => vi.clearAllMocks())

describe('GET /api/setup', () => {
  it('returns setupComplete: false when no users', async () => {
    mockCount.mockResolvedValue(0)
    const res = await GET()
    expect(await res.json()).toEqual({ setupComplete: false })
  })

  it('returns setupComplete: true when users exist', async () => {
    mockCount.mockResolvedValue(1)
    const res = await GET()
    expect(await res.json()).toEqual({ setupComplete: true })
  })
})

describe('POST /api/setup', () => {
  const validBody = {
    householdName: 'Home',
    adminName: 'Admin',
    username: 'admin',
    password: 'password123',
  }

  it('returns 409 when already set up', async () => {
    mockCount.mockResolvedValue(1)
    const req = new Request('http://localhost/api/setup', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('returns 400 when householdName is empty', async () => {
    mockCount.mockResolvedValue(0)
    const req = new Request('http://localhost/api/setup', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, householdName: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    mockCount.mockResolvedValue(0)
    const req = new Request('http://localhost/api/setup', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, password: '123' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when username has invalid characters', async () => {
    mockCount.mockResolvedValue(0)
    const req = new Request('http://localhost/api/setup', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, username: 'Admin User' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates household + user + profile on valid input', async () => {
    mockCount.mockResolvedValue(0)
    mockTx.mockResolvedValue(undefined)
    const req = new Request('http://localhost/api/setup', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ ok: true })
    expect(mockTx).toHaveBeenCalledOnce()
  })
})
