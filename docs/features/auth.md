# Auth Feature

**Status:** Draft — awaiting review
**Phase:** 1
**Implements:** Tasks 9–14 in the implementation plan

---

## Overview

Finansas uses credentials-only authentication: username + bcrypt-hashed password. No OAuth, no email verification, no external identity providers.

Auth is built on NextAuth v5 with JWT session strategy. There is no `PrismaAdapter` — the schema has no `Account`, `Session`, or `VerificationToken` tables.

---

## Files

| File | Responsibility |
|------|---------------|
| `src/lib/auth.ts` | NextAuth config: credentials provider, JWT/session callbacks |
| `src/lib/auth-guard.ts` | `requireAuth()` and `requireAdmin()` helpers for API routes |
| `src/lib/db.ts` | Prisma singleton with Decimal auto-conversion |
| `src/middleware.ts` | Route protection, setup redirect |
| `src/types/next-auth.d.ts` | Session type augmentation |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handler |

---

## Session Shape

The JWT carries:

```ts
{
  sub: string        // User.id
  profileId: string | null
  householdId: string | null
  isAdmin: boolean
}
```

The `Session` type augments `next-auth` defaults to expose these fields on `session.user`:

```ts
session.user.id          // string
session.user.profileId   // string | null
session.user.householdId // string | null
session.user.isAdmin     // boolean
```

---

## Credentials Provider

Login flow:

1. Client POSTs `{ username, password }` to NextAuth
2. `authorize()` looks up `User` by `username`
3. `bcrypt.compare(password, user.passwordHash)` — rejects if false
4. Returns `{ id, name, isAdmin }` on success
5. JWT callback fetches the user's `Profile` to populate `profileId` / `householdId`

Password hashing: `bcrypt.hash(password, 12)` on creation. Cost factor 12 is intentional — slow enough to deter brute force, fast enough for a single-user household app.

---

## Route Protection

Handled in `src/middleware.ts`. The `auth()` wrapper from NextAuth is used as the middleware function.

| Pattern | Rule |
|---------|------|
| `/setup` | Fetch `GET /api/setup` → if `setupComplete: true`, redirect to `/`. Accessible only when no users exist. |
| `/login` | If session exists, redirect to `/`. Public otherwise. |
| `/api/*` | Not covered by middleware — each route uses `requireAuth()` or `requireAdmin()` directly. |
| Everything else | No session → redirect to `/login`. |

`matcher` excludes `_next/static`, `_next/image`, `favicon.ico` to avoid intercepting static assets.

---

## API Route Guards

Two helpers in `src/lib/auth-guard.ts`:

```ts
requireAuth(fn)   // 401 if no session
requireAdmin(fn)  // 401 if no session, 403 if not isAdmin
```

Both call `fn` with a typed session object:

```ts
{
  userId: string
  profileId: string | null
  householdId: string | null
  isAdmin: boolean
}
```

Usage pattern in every API route:

```ts
export async function GET() {
  return requireAuth(async ({ profileId }) => {
    // ... business logic
  })
}
```

---

## Prisma Singleton (`db.ts`)

Uses `@prisma/adapter-pg` for PostgreSQL. Singleton pattern prevents connection pool exhaustion in Next.js dev mode (hot reload creates new module instances).

Decimal fields are auto-converted to `number` via `$extends` result hooks so API responses don't return Prisma `Decimal` objects.

Import path: `'@/generated/prisma/client'` (Prisma 7 — no `index.ts`).

---

## Test Cases

### `auth-guard.ts`
- `requireAuth`: returns 401 when no session
- `requireAuth`: calls `fn` with correct session data when authenticated
- `requireAdmin`: returns 403 when session exists but `isAdmin: false`
- `requireAdmin`: calls `fn` when `isAdmin: true`

### `POST /api/setup` (covered in Phase 2)
- Returns 409 when a user already exists
- Returns 400 on invalid input (short password, missing fields)
- Creates User + Household + Profile in a transaction on valid input

---

## Reference

- `~/financas/src/auth.ts` — original implementation (Google OAuth + credentials dev-only). Finansas drops Google entirely and enables credentials in all environments.
- `~/financas/src/middleware.ts` — same pattern, simplified for single-household.
- NextAuth v5 docs: `https://authjs.dev`
