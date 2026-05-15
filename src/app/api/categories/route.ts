import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  type: z.enum(['EXPENSE', 'INCOME']),
})

export async function GET(req: Request) {
  return requireAuth(async (session) => {
    if (!session.profileId) {
      return NextResponse.json({ error: 'No profile linked to session' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    const categories = await prisma.category.findMany({
      where: {
        profileId: session.profileId,
        ...(type === 'EXPENSE' || type === 'INCOME' ? { type } : {}),
      },
      select: { id: true, name: true, icon: true, color: true, type: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(categories)
  })
}

export async function POST(req: Request) {
  return requireAuth(async (session) => {
    if (!session.profileId) {
      return NextResponse.json({ error: 'No profile linked to session' }, { status: 400 })
    }

    const body = await req.json()
    const result = CreateCategorySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { name, icon, color, type } = result.data

    const existing = await prisma.category.findUnique({
      where: { name_type_profileId: { name, type, profileId: session.profileId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'nameTaken' }, { status: 409 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon: icon ?? 'Circle',
        color: color ?? '#6b7280',
        type,
        profileId: session.profileId,
      },
      select: { id: true, name: true, icon: true, color: true, type: true },
    })

    return NextResponse.json(category, { status: 201 })
  })
}
