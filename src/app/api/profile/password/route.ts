import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request) {
  return requireAuth(async (session) => {
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'wrongPassword' }, { status: 403 })
    }

    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: hash } })

    return NextResponse.json({ ok: true })
  })
}
