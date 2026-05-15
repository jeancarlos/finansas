import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import { CreateUserSchema } from '@/lib/schemas'

export async function GET() {
  return requireAdmin(async () => {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, isAdmin: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(users)
  })
}

export async function POST(req: Request) {
  return requireAdmin(async () => {
    const body = await req.json()
    const result = CreateUserSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }
    const { username, name, password, isAdmin } = result.data

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { username, name, passwordHash, isAdmin },
      select: { id: true, username: true, name: true, isAdmin: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  })
}
