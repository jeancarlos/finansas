# App Shell Feature

**Status:** Complete
**Phase:** 3 + Layout upgrade
**Implements:** App layout, navigation, glass design system

---

## Overview

The app shell wraps all authenticated pages (`src/app/(app)/`). It provides the page background, safe-area insets for mobile, the glass pill bottom navigation, and the contextual FAB. It is a pure layout layer — it fetches no data.

---

## Files

| File | Responsibility |
|------|---------------|
| `src/app/(app)/layout.tsx` | Route group layout — sets `force-dynamic`, renders `<AppShell>` |
| `src/components/app-shell.tsx` | Gradient background, top fade, safe-area padding, nav pill container |
| `src/components/bottom-nav.tsx` | Glass pill nav with framer-motion active indicator |
| `src/components/contextual-fab.tsx` | Route-aware FAB, dispatches CustomEvents |
| `src/components/glass-card.tsx` | Glassmorphism card with motion scale |
| `src/components/money.tsx` | Locale-aware currency display |
| `src/components/currency-input.tsx` | Locale-aware currency mask input |
| `src/lib/icons.ts` | Lucide icon name → component map |
| `src/app/globals.css` | Glass utilities, font tokens, no-scrollbar |
| `src/app/layout.tsx` | Root layout — loads fonts, sets viewport |

---

## Layout Structure

```
<html> (Roboto + JetBrains Mono vars, antialiased)
  <body>
    <Providers>               ← SessionProvider wrapper (client boundary)
      <AppShell>              ← gradient bg, safe-area padding
        <main>                ← max-w-lg, px-4, safe-area insets
          {children}          ← page content
        </main>
        [backdrop blur div]   ← pointer-events-none, visual only
        [nav pill container]  ← fixed bottom-5, z-40
          <BottomNav />
          <ContextualFab />
      </AppShell>
    </Providers>
  </body>
</html>
```

---

## Fonts

Loaded via `next/font/google` in `src/app/layout.tsx`:

| Variable | Font | Used for |
|----------|------|---------|
| `--font-roboto` | Roboto 400/500/600/700 | `font-sans` (body text) |
| `--font-jetbrains` | JetBrains Mono 400/700/800 | `font-mono`, `font-brand` (money amounts) |

In `globals.css @theme`:
```css
--font-sans: var(--font-roboto), sans-serif;
--font-mono: var(--font-jetbrains), monospace;
--font-brand: var(--font-jetbrains), monospace;
```

---

## Glass Utilities (`globals.css`)

```css
.glass          /* light glass — nav, tooltips */
.glass-card     /* card glass — content cards, 1.25rem radius */
.glass-card:hover  /* lift + stronger shadow on hover */
.no-scrollbar   /* hide scrollbar cross-browser */
```

---

## BottomNav

Routes:

| Path | Icon | Label |
|------|------|-------|
| `/` | Home | nav.home |
| `/transactions` | ArrowLeftRight | nav.transactions |
| `/recurring` | RefreshCw | nav.recurring |
| `/goals` | Target | nav.goals |
| `/projections` | TrendingUp | nav.projections |
| `/admin` | Settings | nav.admin (admin only) |

Active indicator: `framer-motion` with `layoutId="nav-pill"` — the pill slides between items using spring animation. Active color: `#6366f1` (ACCENT constant).

---

## ContextualFab

Route → event mapping:

| Path | Icon | Event dispatched |
|------|------|-----------------|
| `/` | Receipt | `fab-add-transaction` |
| `/transactions` | Receipt | `fab-add-transaction` |
| `/categories` | Tag | `fab-add-category` |
| `/recurring` | Repeat | `fab-add-recurring` |
| `/goals` | Target | `fab-add-goal` |
| `/projections` | — | hidden (no FAB) |
| `/admin` | — | hidden (no FAB) |

The FAB dispatches a `CustomEvent` on `window`. Pages listen for their event and open their add form. Long-press (500ms) shows a tooltip. Icon transitions animate with `AnimatePresence mode="wait"`.

Pages wire up like:
```ts
useEffect(() => {
  const handler = () => setAddOpen(true)
  window.addEventListener('fab-add-category', handler)
  return () => window.removeEventListener('fab-add-category', handler)
}, [])
```

---

## GlassCard

```ts
<GlassCard hoverable={true} onClick={fn} className="...">
  {children}
</GlassCard>
```

Uses `motion.div` with `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.98 }}` (only when `onClick` is provided). The `glass-card` CSS class handles the visual treatment.

---

## Money

Server-safe (no `'use client'`). Calls `formatCurrency(value)` from `src/lib/locale.ts`.

```tsx
<Money value={1234.56} prefix="+" className="text-emerald-600" />
// → "+$1,234.56" (en) or "+R$ 1.234,56" (pt-BR)
```

---

## CurrencyInput

Client component with locale-aware mask. Emits `onValueChange(string)` with formatted display value. Call `parseFloat(value.replace(/[^0-9]/g, '')) / 100` to get numeric value.

Mask examples:
- `en` (USD): `1,234.56`
- `pt-BR` (BRL): `1.234,56`

---

## Safe-Area Insets

`AppShell` uses `env(safe-area-inset-*)` for padding on all sides so content is never clipped by device notches or home indicators. Requires `viewportFit: 'cover'` in the root layout viewport export.

---

## Reference

- `src/app/(app)/layout.tsx` — `export const dynamic = 'force-dynamic'`
- `src/components/providers.tsx` — `SessionProvider` client wrapper
- `src/hooks/use-locale.ts` — client hook for locale
- `src/hooks/use-profile.ts` — client hook for `isAdmin` (used by BottomNav)
