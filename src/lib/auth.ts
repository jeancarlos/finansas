import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = (user as { isAdmin: boolean }).isAdmin
        const profile = await prisma.profile.findFirst({
          where: { userId: token.sub! },
        })
        token.profileId = profile?.id ?? null
        token.householdId = profile?.householdId ?? null
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.profileId = (token.profileId as string | null) ?? null
      session.user.householdId = (token.householdId as string | null) ?? null
      session.user.isAdmin = (token.isAdmin as boolean) ?? false
      return session
    },
  },
})
