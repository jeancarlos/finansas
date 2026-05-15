import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CategoriesPageClient } from './categories-page-client'

export default async function CategoriesPage() {
  const session = await auth()
  const profileId = session?.user?.profileId ?? null

  if (!profileId) {
    return <p className="text-muted-foreground">No profile linked to this account.</p>
  }

  const categories = await prisma.category.findMany({
    where: { profileId },
    select: { id: true, name: true, icon: true, color: true, type: true },
    orderBy: { createdAt: 'asc' },
  })

  return <CategoriesPageClient categories={categories} />
}
