# Quickstart: Modern GUI Redesign

**Feature**: 001-modern-gui-redesign
**Date**: 2026-04-18

This guide covers the one-time setup steps required before implementing the redesign.
Run these commands from the project root (`bs/`).

---

## Step 1: Install new dependencies

```bash
npm install framer-motion
npm install lucide-react
npm install clsx tailwind-merge
```

> `lucide-react` will also be installed automatically by shadcn, but installing it first
> ensures the correct version.

---

## Step 2: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted, select:
- **Style**: Default
- **Base color**: Slate
- **CSS variables**: Yes
- **Tailwind config**: Yes (auto-detected for v4)
- **Import alias for components**: `@/components/ui`
- **Import alias for utils**: `@/lib/utils`

This creates:
- `components/ui/` — generated component files
- `lib/utils.ts` — cn() utility (clsx + tailwind-merge)

---

## Step 3: Add required shadcn components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add progress
npx shadcn@latest add avatar
npx shadcn@latest add tabs
npx shadcn@latest add separator
```

---

## Step 4: Configure fonts in `app/layout.tsx`

Replace the existing Google Fonts import with `next/font`:

```tsx
import { Plus_Jakarta_Sans, Cairo } from 'next/font/google'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-arabic',
  display: 'swap',
})

// In the layout body tag:
<body className={`${plusJakartaSans.variable} ${cairo.variable} font-sans`}>
```

---

## Step 5: Update `app/globals.css` with design tokens

Replace the current globals.css content with the design system tokens defined in
`specs/001-modern-gui-redesign/data-model.md` (Color Tokens, Typography Tokens, Spacing Tokens).

The CSS custom properties use the `--color-*`, `--font-*`, `--radius-*` naming convention
that shadcn/ui components reference via Tailwind CSS v4 theme.

---

## Step 6: Verify setup

```bash
npm run dev
```

Open http://localhost:3000 and confirm:
- The login page loads without errors
- Plus Jakarta Sans is applied to all English text
- No console errors from missing modules

---

## Step 7: Validate Arabic font

Navigate to the kid dashboard (log in as a kid user) and verify:
- Cairo font is applied to the Bible passage section
- Arabic text flows right-to-left without overflow
- Verse numbers are visually distinct from verse text

---

## Validation Checklist

- [ ] `framer-motion` importable in a client component
- [ ] `lucide-react` icons render (e.g., `<BookOpen />`)
- [ ] `cn()` utility importable from `@/lib/utils`
- [ ] shadcn `<Button>` renders with correct styling
- [ ] Plus Jakarta Sans applied globally to English text
- [ ] Cairo applied to Arabic Bible passage text
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero errors
