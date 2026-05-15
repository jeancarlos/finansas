import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import { CreateProfileSchema } from '@/lib/schemas'
import { getDefaultCategories } from '@/lib/default-categories'

export async function GET() {
  return requireAdmin(async () => {
    const profiles = await prisma.profile.findMany({
      select: {
        id: true,
        displayName: true,
        avatar: true,
        color: true,
        createdAt: true,
        user: { select: { id: true, username: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(profiles)
  })
}

export async function POST(req: Request) {
  return requireAdmin(async () => {
    const body = await req.json()
    const result = CreateProfileSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }
    const { displayName, userId, avatar, color } = result.data

    const household = await prisma.household.findFirst()
    if (!household) {
      return NextResponse.json({ error: 'No household found' }, { status: 500 })
    }

    const profile = await prisma.$transaction(async (tx) => {
      const p = await tx.profile.create({
        data: { displayName, userId, avatar: avatar ?? '', color: color ?? '#6366f1', householdId: household.id },
        select: {
          id: true,
          displayName: true,
          avatar: true,
          color: true,
          createdAt: true,
          user: { select: { id: true, username: true, name: true } },
        },
      })
      await tx.category.createMany({
        data: getDefaultCategories().map((c) => ({ ...c, profileId: p.id })),
      })
      return p
    })

    return NextResponse.json(profile, { status: 201 })
  })
}
