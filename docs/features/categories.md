# Categories Feature

**Status:** Draft — awaiting review
**Phase:** 6
**Implements:** Tasks 29–32 in the implementation plan

---

## Overview

Categories belong to a Profile. When a profile is created (via `POST /api/admin/profiles`), a set of default categories is seeded into that profile automatically. Users and admins can then add or delete categories. There is no global/shared category pool.

---

## Files

| File | Responsibility |
|------|---------------|
| `src/lib/default-categories.ts` | Static list of default categories (en + pt-BR) |
| `src/app/api/categories/route.ts` | `GET` list profile's categories · `POST` create category |
| `src/app/api/categories/[id]/route.ts` | `DELETE` remove category |
| `src/app/(app)/categories/page.tsx` | Server component — fetches categories, renders client shell |
| `src/app/(app)/categories/categories-page-client.tsx` | Client component — list by type tab, create form, delete |
| `src/app/api/categories/__tests__/route.test.ts` | API unit tests |

The profile creation route (`src/app/api/admin/profiles/route.ts`) is modified to seed default categories after creating the profile.

---

## Default Categories

Defined in `src/lib/default-categories.ts`. Two locale variants: `en` and `pt-BR`. Which set is used for seeding is determined by `NEXT_PUBLIC_LOCALE` at runtime.

```ts
export type DefaultCategory = {
  name: string
  icon: string   // Lucide icon name
  color: string  // hex
  type: 'EXPENSE' | 'INCOME'
}

export const DEFAULT_CATEGORIES: Record<string, DefaultCategory[]> = {
  en: [
    // Expense
    { name: 'Housing',        icon: 'Home',            color: '#6366f1', type: 'EXPENSE' },
    { name: 'Food',           icon: 'UtensilsCrossed', color: '#f97316', type: 'EXPENSE' },
    { name: 'Groceries',      icon: 'ShoppingCart',    color: '#f59e0b', type: 'EXPENSE' },
    { name: 'Transport',      icon: 'Car',             color: '#3b82f6', type: 'EXPENSE' },
    { name: 'Entertainment',  icon: 'Gamepad2',        color: '#a855f7', type: 'EXPENSE' },
    { name: 'Health',         icon: 'Heart',           color: '#ef4444', type: 'EXPENSE' },
    { name: 'Education',      icon: 'GraduationCap',   color: '#14b8a6', type: 'EXPENSE' },
    { name: 'Subscriptions',  icon: 'CreditCard',      color: '#ec4899', type: 'EXPENSE' },
    { name: 'Clothing',       icon: 'Shirt',           color: '#8b5cf6', type: 'EXPENSE' },
    { name: 'Pets',           icon: 'PawPrint',        color: '#d97706', type: 'EXPENSE' },
    { name: 'Gifts',          icon: 'Gift',            color: '#e11d48', type: 'EXPENSE' },
    { name: 'Travel',         icon: 'Plane',           color: '#0ea5e9', type: 'EXPENSE' },
    { name: 'Taxes',          icon: 'Receipt',         color: '#64748b', type: 'EXPENSE' },
    { name: 'Other',          icon: 'MoreHorizontal',  color: '#6b7280', type: 'EXPENSE' },
    // Income
    { name: 'Salary',         icon: 'Banknote',        color: '#10b981', type: 'INCOME' },
    { name: 'Freelance',      icon: 'Laptop',          color: '#06b6d4', type: 'INCOME' },
    { name: 'Investments',    icon: 'TrendingUp',      color: '#22c55e', type: 'INCOME' },
    { name: 'Gift Received',  icon: 'Gift',            color: '#f43f5e', type: 'INCOME' },
    { name: 'Other',          icon: 'MoreHorizontal',  color: '#6b7280', type: 'INCOME' },
  ],
  'pt-BR': [
    // Expense
    { name: 'Moradia',        icon: 'Home',            color: '#6366f1', type: 'EXPENSE' },
    { name: 'Alimentação',    icon: 'UtensilsCrossed', color: '#f97316', type: 'EXPENSE' },
    { name: 'Mercado',        icon: 'ShoppingCart',    color: '#f59e0b', type: 'EXPENSE' },
    { name: 'Transporte',     icon: 'Car',             color: '#3b82f6', type: 'EXPENSE' },
    { name: 'Lazer',          icon: 'Gamepad2',        color: '#a855f7', type: 'EXPENSE' },
    { name: 'Saúde',          icon: 'Heart',           color: '#ef4444', type: 'EXPENSE' },
    { name: 'Educação',       icon: 'GraduationCap',   color: '#14b8a6', type: 'EXPENSE' },
    { name: 'Assinaturas',    icon: 'CreditCard',      color: '#ec4899', type: 'EXPENSE' },
    { name: 'Vestuário',      icon: 'Shirt',           color: '#8b5cf6', type: 'EXPENSE' },
    { name: 'Pets',           icon: 'PawPrint',        color: '#d97706', type: 'EXPENSE' },
    { name: 'Presentes',      icon: 'Gift',            color: '#e11d48', type: 'EXPENSE' },
    { name: 'Viagem',         icon: 'Plane',           color: '#0ea5e9', type: 'EXPENSE' },
    { name: 'Impostos',       icon: 'Receipt',         color: '#64748b', type: 'EXPENSE' },
    { name: 'Outros',         icon: 'MoreHorizontal',  color: '#6b7280', type: 'EXPENSE' },
    // Income
    { name: 'Salário',        icon: 'Banknote',        color: '#10b981', type: 'INCOME' },
    { name: 'Freelance',      icon: 'Laptop',          color: '#06b6d4', type: 'INCOME' },
    { name: 'Investimentos',  icon: 'TrendingUp',      color: '#22c55e', type: 'INCOME' },
    { name: 'Presente Recebido', icon: 'Gift',         color: '#f43f5e', type: 'INCOME' },
    { name: 'Outros',         icon: 'MoreHorizontal',  color: '#6b7280', type: 'INCOME' },
  ],
}

export function getDefaultCategories(): DefaultCategory[] {
  const lang = process.env.NEXT_PUBLIC_LOCALE ?? 'en'
  return DEFAULT_CATEGORIES[lang] ?? DEFAULT_CATEGORIES['en']
}
```

---

## API Design

### `GET /api/categories?type=EXPENSE|INCOME`

Requires auth (`requireAuth`). Returns categories for `session.profileId`. Optional `type` filter.

Returns 400 if `profileId` is null (no profile linked to session).

### `POST /api/categories`

Body: `{ name, icon?, color?, type }` validated by `CreateCategorySchema`.

```ts
CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  type: z.enum(['EXPENSE', 'INCOME']),
})
```

Returns 409 if a category with the same name + type already exists for the profile.

### `DELETE /api/categories/[id]`

Requires auth. Verifies the category belongs to `session.profileId` before deleting (403 otherwise). Returns 204.

---

## Profile creation seeding

`POST /api/admin/profiles` (existing route) is modified to call `seedCategories(profileId)` after the profile is created:

```ts
await prisma.category.createMany({
  data: getDefaultCategories().map(c => ({ ...c, profileId }))
})
```

---

## UI — `/categories` page

Two tabs: **Expenses** | **Income**. Each tab shows:
- List of existing categories (colored icon, name, delete button)
- Inline form at the bottom to add a new category (name, icon picker simplified to text input, color picker simplified to hex input, type pre-set by active tab)

The page is for the currently logged-in profile (`session.profileId`). If `profileId` is null (user has no profile), shows a message.

Icon and color fields are optional — defaults to `'Circle'` icon and `'#6b7280'` color if not provided.

---

## i18n additions

```ts
// messages/en.ts additions
categories: {
  title: 'Categories',
  expenses: 'Expenses',
  income: 'Income',
  newCategory: 'New category',
  name: 'Name',
  icon: 'Icon',
  color: 'Color',
  noCategories: 'No categories yet',
  confirmDelete: 'Delete this category?',
  nameTaken: 'A category with this name already exists',
}
```

Same keys in `pt-BR.ts`.

---

## Reference

- `prisma/schema.prisma` — Category model (`name`, `icon`, `color`, `type`, `profileId`)
- `src/app/api/admin/profiles/route.ts` — modified to seed on create
- `src/lib/locale.ts` — `locale.lang` used to pick default category set
