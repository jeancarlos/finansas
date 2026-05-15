import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export default auth(async function middleware(req) {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (pathname.startsWith('/setup')) {
    const check = await fetch(new URL('/api/setup', req.url))
    const { setupComplete } = await check.json()
    if (setupComplete) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next()
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
