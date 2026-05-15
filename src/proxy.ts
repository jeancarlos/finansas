import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth(async function proxy(req) {
  const { pathname } = req.nextUrl
  const session = req.auth

  const check = await fetch(new URL('/api/setup', req.url))
  const { setupComplete } = await check.json()

  if (!setupComplete) {
    if (pathname.startsWith('/setup')) return NextResponse.next()
    return NextResponse.redirect(new URL('/setup', req.url))
  }

  // Setup is complete from here on
  if (pathname.startsWith('/setup')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/login')) {
    if (session) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
}
