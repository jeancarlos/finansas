import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'

export async function GET() {
  return requireAuth(async (session) => {
    if (!session.profileId) {
      return NextResponse.json({ error: 'No profile' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({
      where: { id: session.profileId },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        color: true,
        household: { select: { id: true, name: true } },
        user: { select: { username: true } },
      },
    })

    if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(profile)
  })
}

export async function PATCH(req: Request) {
  return requireAuth(async (session) => {
    if (!session.profileId) {
      return NextResponse.json({ error: 'No profile' }, { status: 400 })
    }

    const body = await req.json()
    const { displayName, avatar, color } = body

    const updated = await prisma.profile.update({
      where: { id: session.profileId },
      data: {
        ...(displayName !== undefined && { displayName: String(displayName).trim() }),
        ...(avatar !== undefined && { avatar: String(avatar) }),
        ...(color !== undefined && { color: String(color) }),
      },
      select: { id: true, displayName: true, avatar: true, color: true },
    })

    return NextResponse.json(updated)
  })
}
