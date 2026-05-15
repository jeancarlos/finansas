import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'

export async function GET() {
  return requireAuth(async (session) => {
    if (!session.householdId) {
      return NextResponse.json({ error: 'No household' }, { status: 400 })
    }
    const profiles = await prisma.profile.findMany({
      where: { householdId: session.householdId },
      select: { id: true, displayName: true, avatar: true, color: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(profiles)
  })
}
