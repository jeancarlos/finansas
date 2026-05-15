import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token }) {
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.profileId = (token.profileId as string | null) ?? null
      session.user.householdId = (token.householdId as string | null) ?? null
      session.user.isAdmin = (token.isAdmin as boolean) ?? false
      session.user.profileColor = (token.profileColor as string) ?? '#6366f1'
      session.user.profileAvatar = (token.profileAvatar as string) ?? ''
      return session
    },
  },
}
