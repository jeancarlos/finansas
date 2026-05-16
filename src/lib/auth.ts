import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { type: 'text' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null
        return { id: user.id, name: user.name, isAdmin: user.isAdmin }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user || trigger === 'update') {
        if (user) token.isAdmin = (user as { isAdmin: boolean }).isAdmin
        const profile = await prisma.profile.findFirst({
          where: { userId: token.sub! },
          select: { id: true, householdId: true, color: true, avatar: true },
        })
        token.profileId = profile?.id ?? null
        token.householdId = profile?.householdId ?? null
        token.profileColor = profile?.color ?? '#6366f1'
        token.profileAvatar = profile?.avatar ?? ''
      }
      return token
    },
    session: authConfig.callbacks!.session,
  },
})
