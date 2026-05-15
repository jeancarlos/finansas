import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AdminPageClient } from './admin-page-client'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return (
      <div>
        <p className="text-destructive">Access denied.</p>
      </div>
    )
  }

  const [household, users, profiles] = await Promise.all([
    prisma.household.findFirst({ select: { id: true, name: true } }),
    prisma.user.findMany({
      select: { id: true, username: true, name: true, isAdmin: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.profile.findMany({
      select: {
        id: true,
        displayName: true,
        avatar: true,
        color: true,
        createdAt: true,
        user: { select: { id: true, username: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!household) {
    return <p className="text-destructive">No household found.</p>
  }

  return (
    <AdminPageClient
      household={household}
      users={users}
      profiles={profiles}
      currentUserId={session.user.id}
    />
  )
}
