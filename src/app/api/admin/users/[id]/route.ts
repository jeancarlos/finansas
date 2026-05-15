import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import { ResetPasswordSchema } from '@/lib/schemas'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  return requireAdmin(async () => {
    const body = await req.json()
    const result = ResetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }
    const passwordHash = await bcrypt.hash(result.data.password, 12)
    await prisma.user.update({ where: { id }, data: { passwordHash } })
    return NextResponse.json({ ok: true })
  })
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  return requireAdmin(async (session) => {
    if (id === session.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }
    await prisma.user.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  })
}
