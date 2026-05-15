import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return requireAuth(async (session) => {
    if (!session.profileId) {
      return NextResponse.json({ error: 'No profile linked to session' }, { status: 400 })
    }

    const { id } = await params

    const category = await prisma.category.findUnique({
      where: { id },
      select: { profileId: true },
    })

    if (!category) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (category.profileId !== session.profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.category.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  })
}
