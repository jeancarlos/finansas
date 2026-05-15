import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-guard'
import { prisma } from '@/lib/db'
import { UpdateTransactionSchema } from '@/lib/schemas'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  return requireAuth(async (session) => {
    const { id } = await params

    const tx = await prisma.transaction.findUnique({ where: { id } })
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (tx.profileId !== session.profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const result = UpdateTransactionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { amount, description, categoryId, date, originProfileId } = result.data
    const data: Record<string, unknown> = {}
    if (amount !== undefined) data.amount = amount
    if (description !== undefined) data.description = description
    if (categoryId !== undefined) data.categoryId = categoryId
    if (date !== undefined) data.date = date
    if (originProfileId !== undefined) data.originProfileId = originProfileId

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    })

    return NextResponse.json(updated)
  })
}

export async function DELETE(_req: Request, { params }: Params) {
  return requireAuth(async (session) => {
    const { id } = await params

    const tx = await prisma.transaction.findUnique({ where: { id } })
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (tx.profileId !== session.profileId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.transaction.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  })
}
