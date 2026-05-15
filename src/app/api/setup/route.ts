import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { SetupSchema } from '@/lib/schemas'

export async function GET() {
  const count = await prisma.user.count()
  return NextResponse.json({ setupComplete: count > 0 })
}

export async function POST(req: Request) {
  const count = await prisma.user.count()
  if (count > 0) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 409 })
  }

  const body = await req.json()
  const parsed = SetupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { householdName, adminName, username, password } = parsed.data
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.$transaction(async (tx) => {
    const household = await tx.household.create({ data: { name: householdName } })
    const user = await tx.user.create({ data: { username, passwordHash, name: adminName, isAdmin: true } })
    await tx.profile.create({ data: { displayName: adminName, userId: user.id, householdId: household.id } })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
