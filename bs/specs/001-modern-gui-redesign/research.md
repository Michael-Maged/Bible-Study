# Research: Modern GUI Redesign

**Feature**: 001-modern-gui-redesign
**Phase**: 0 — Design Decisions & Library Research
**Date**: 2026-04-18

---

## Decision 1: Color Palette

**Decision**: Replace #59f20d neon green with an Indigo + Amber design system.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--color-primary` | #4338ca (indigo-700) | #818cf8 (indigo-400) | Primary actions, nav active |
| `--color-primary-hover` | #3730a3 (indigo-800) | #a5b4fc (indigo-300) | Hover states |
| `--color-accent` | #d97706 (amber-600) | #fbbf24 (amber-400) | Badges, highlights, streaks |
| `--color-surface` | #ffffff | #1e293b (slate-800) | Cards, panels |
| `--color-background` | #f8fafc (slate-50) | #0f172a (slate-900) | Page background |
| `--color-text` | #0f172a (slate-900) | #f8fafc (slate-50) | Body text |
| `--color-text-muted` | #64748b (slate-500) | #94a3b8 (slate-400) | Secondary text |
| `--color-success` | #059669 (emerald-600) | #34d399 (emerald-400) | Completion states |
| `--color-danger` | #dc2626 (red-600) | #f87171 (red-400) | Destructive actions |
| `--color-border` | #e2e8f0 (slate-200) | #334155 (slate-700) | Card borders |
| `--color-arabic-text` | #292524 (stone-800) | #e7e5e4 (stone-200) | Bible passage text |

**Rationale**: Indigo is calm, trustworthy, and associated with wisdom and spirituality in many
cultures — appropriate for a Bible study platform. Amber adds warmth and energy, appealing to
kids without being garish. The combination is accessible (WCAG AA compliant contrast ratios).
The previous #59f20d neon green, while distinctive, read as "gaming" rather than "spiritual
education."

**Alternatives considered**:
- Purple + gold (too jewel-toned, hard to maintain WCAG AA)
- Teal + coral (too casual, not spiritually aligned)
- Keeping #59f20d refined (rejected: user explicitly open to new palette)

---

## Decision 2: UI Component Library

**Decision**: shadcn/ui with Radix UI primitives.

**Rationale**: shadcn/ui generates accessible, unstyled component source code directly into the
project (not a black-box npm dependency). This gives full control over styling with Tailwind
while inheriting production-quality accessibility from Radix UI (focus management, ARIA roles,
keyboard navigation). Works natively with Tailwind CSS v4 and React 19. Components include:
Button, Card, Badge, Dialog, Progress, Avatar, Tabs — all needed for this redesign.

**Alternatives considered**:
- Chakra UI: heavy bundle, complex theme system incompatible with Tailwind v4
- MUI (Material): Material Design aesthetic inappropriate for a spiritual kids app
- Headless UI: Less complete than Radix; Tailwind already covers shadcn's use case better

---

## Decision 3: Animation Library

**Decision**: Framer Motion for page transitions and select micro-animations.

**Rationale**: Kids respond to motion — smooth transitions between screens reduce cognitive
jarring and make the app feel premium. Framer Motion integrates cleanly with Next.js App Router
layouts via `AnimatePresence`. Usage is scoped to:
- Page entry/exit transitions (fade + slide, ~200ms)
- Reading card reveal (spring, ~300ms)
- Quiz answer selection feedback (scale pulse, ~150ms)
- Progress bar fill animations

**Constraints**: Framer Motion components require `"use client"`. Each animated component is
isolated at the leaf level — parent Server Components are unaffected.

**Alternatives considered**:
- CSS-only transitions: Insufficient for cross-route transitions in App Router
- React Spring: More complex API for no additional benefit in this use case

---

## Decision 4: English Typography

**Decision**: Plus Jakarta Sans via `next/font/google`.

**Rationale**: Plus Jakarta Sans is a modern geometric sans-serif with strong character at
display sizes (used for headings) and excellent legibility at small sizes (used for body/labels).
Its rounded letterforms are friendly for kids without being cartoonish. Available via Google
Fonts with `next/font` optimization (zero layout shift, self-hosted).

**Alternatives considered**:
- Inter: Excellent but ubiquitous; Plus Jakarta Sans is more distinctive
- Outfit: Good but narrower x-height, less readable at small sizes
- Keeping Spline Sans: Less modern weight variety; no variable font

---

## Decision 5: Arabic Typography

**Decision**: Cairo via `next/font/google`, subset to Arabic + numerals.

**Rationale**: Cairo is a modern Arabic typeface designed for screen reading with clean, legible
forms at all sizes. It has full Unicode Arabic coverage and renders correctly in RTL context. Its
modern proportions pair well with Plus Jakarta Sans without visual clash at language boundaries.
Loaded with `next/font` subsetting (`subset: ['arabic']`) to minimize bundle size.

**Alternatives considered**:
- Amiri: Beautiful but traditional; better for print than screen UI
- Noto Sans Arabic: Excellent coverage but less distinctive
- System Arabic fonts: Inconsistent rendering across iOS/Android/Windows

---

## Decision 6: Icon System

**Decision**: Lucide React (installed as part of shadcn/ui setup).

**Rationale**: Lucide provides consistent, accessible SVG icons that complement the clean
geometric design system. Replacing emoji icons with proper SVG icons (BookOpen, CheckCircle2,
Trophy, User, etc.) improves visual consistency and avoids platform-dependent emoji rendering
differences between iOS, Android, and Windows.

**Exception**: Celebratory contexts (quiz completion, streak milestones) may retain 1–2 emoji
for emotional resonance, as these are intentional delight moments, not informational icons.

---

## Decision 7: Navigation Pattern

**Decision**: Bottom navigation bar for mobile (existing pattern, redesigned); side rail for desktop.

**Rationale**: Bottom nav is the established mobile pattern for this app and matches how kids
naturally hold phones. The redesign improves it with:
- Filled/outlined icon state for active vs. inactive
- Label below icon (accessibility)
- Animated indicator bar above active item (Framer Motion)
- Desktop: the same nav items appear in a left sidebar

---

## Decision 8: Server vs. Client Components

**Decision**: Convert page wrappers to Server Components where data can be fetched server-side;
keep interactive sections as `"use client"` leaf components.

**Rationale**: The current codebase marks entire pages as `"use client"` for data fetching with
useState/useEffect. The redesign splits pages into:
- Server Component (page.tsx): fetches initial data via Supabase server client
- Client Component (XxxView.tsx): handles interactivity (quiz answers, button clicks)

This reduces client JS bundle and improves LCP. Applies to: kid dashboard, admin dashboard,
kid history, admin kids list.
