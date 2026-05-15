import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import { HouseholdNameSchema } from '@/lib/schemas'

export async function PATCH(req: Request) {
  return requireAdmin(async () => {
    const body = await req.json()
    const result = HouseholdNameSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const household = await prisma.household.findFirst()
    if (!household) {
      return NextResponse.json({ error: 'No household found' }, { status: 500 })
    }

    const updated = await prisma.household.update({
      where: { id: household.id },
      data: { name: result.data.name },
      select: { id: true, name: true },
    })
    return NextResponse.json(updated)
  })
}
