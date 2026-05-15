# Admin Panel Feature

**Status:** Complete
**Phase:** 4
**Implements:** Tasks for user, profile, and household management

---

## Overview

The admin panel is accessible only to users with `isAdmin: true` in their session. It allows managing users (create, reset password, delete), profiles (create, delete), and the household name. There is a single household in Finansas — all operations use `prisma.household.findFirst()`.

---

## Files

| File | Responsibility |
|------|---------------|
| `src/app/(app)/admin/page.tsx` | Server component — auth check, parallel fetch, passes to client |
| `src/app/(app)/admin/admin-page-client.tsx` | Client component — 3-tab UI (Users / Profiles / Household) |
| `src/app/api/admin/users/route.ts` | `GET` list users · `POST` create user |
| `src/app/api/admin/users/[id]/route.ts` | `PATCH` reset password · `DELETE` remove user |
| `src/app/api/admin/profiles/route.ts` | `GET` list profiles w/ user · `POST` create profile |
| `src/app/api/admin/profiles/[id]/route.ts` | `DELETE` remove profile |
| `src/app/api/admin/household/route.ts` | `PATCH` rename household |
| `src/app/api/admin/__tests__/admin-api.test.ts` | 14 API unit tests |
| `src/lib/schemas.ts` | Zod schemas for all admin inputs |

---

## Auth Guard

All API routes use `requireAdmin(session => handler(session))`. The helper in `src/lib/auth.ts` returns 401 if no session, 403 if not admin. The server component also redirects to `/` if not admin.

---

## API Design

### `GET /api/admin/users`

Returns `{ id, username, displayName, isAdmin, createdAt }[]` (no passwords).

### `POST /api/admin/users`

Schema: `CreateUserSchema`
```ts
z.object({
  username: z.string().min(1).max(50).regex(/^[a-z0-9_-]+$/),
  displayName: z.string().max(100).optional(),
  password: z.string().min(8),
  isAdmin: z.boolean().default(false),
})
```
Returns 409 if username taken. Hashes password with bcrypt cost 12.

### `PATCH /api/admin/users/[id]`

Schema: `ResetPasswordSchema` — `{ password: z.string().min(8) }`. Re-hashes and saves.

### `DELETE /api/admin/users/[id]`

Returns 400 if `id === session.userId` (cannot delete self). Cascades via Prisma (`onDelete: Cascade`).

### `GET /api/admin/profiles`

Returns profiles with nested `user { username, displayName }`.

### `POST /api/admin/profiles`

Schema: `CreateProfileSchema`
```ts
z.object({
  displayName: z.string().min(1).max(100),
  userId: z.string().min(1),
})
```
Finds the single household via `findFirst()`. After creating the profile, seeds default categories (Phase 6 modification).

### `DELETE /api/admin/profiles/[id]`

Cascades all profile data (transactions, categories, goals, etc.).

### `PATCH /api/admin/household`

Schema: `HouseholdNameSchema` — `{ name: z.string().min(1).max(100) }`.

---

## UI

Three tabs rendered in `admin-page-client.tsx`:

**Users tab:**
- List with username, displayName, badges (you / admin)
- Create form: username, displayName (optional), password, isAdmin checkbox
- Per-row: Reset password button, Delete button (disabled for self)

**Profiles tab:**
- List with displayName, linked username
- Create form: displayName, user select
- Per-row: Delete button

**Household tab:**
- Single form to rename the household

All forms use `useTransition` + `router.refresh()` for optimistic-free server sync.

---

## WCAG Notes

- `SelectTrigger` is a `<button>`, not a native `<select>` — `htmlFor` doesn't work. Use `aria-labelledby` pointing to the label `id`.
- `isAdmin` checkbox: shadcn `<Checkbox>` is not in `FormData`. Managed via `useState` and passed explicitly to `POST` body.

---

## i18n Keys

All strings come from `t('admin')`. See `src/lib/messages/en.ts` for the full key list.

---

## Reference

- `src/lib/auth.ts` — `requireAdmin`, `requireAuth` helpers
- `src/lib/schemas.ts` — all Zod schemas
- `prisma/schema.prisma` — User, Profile, Household models
