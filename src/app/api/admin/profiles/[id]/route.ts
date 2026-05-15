import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params
  return requireAdmin(async () => {
    await prisma.profile.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  })
}
