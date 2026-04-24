# Data Model: Modern GUI Redesign

**Feature**: 001-modern-gui-redesign
**Phase**: 1 — Design System & Component Entities
**Date**: 2026-04-18

---

## Design System Tokens

These CSS custom properties are defined in `app/globals.css` and used throughout all components.
They are the single source of truth for color, typography, spacing, and radius.

### Color Tokens

```css
:root {
  /* Primary (Indigo) */
  --color-primary:        #4338ca;
  --color-primary-hover:  #3730a3;
  --color-primary-fg:     #ffffff;

  /* Accent (Amber) */
  --color-accent:         #d97706;
  --color-accent-hover:   #b45309;
  --color-accent-fg:      #ffffff;

  /* Surfaces */
  --color-background:     #f8fafc;
  --color-surface:        #ffffff;
  --color-surface-raised: #f1f5f9;

  /* Text */
  --color-text:           #0f172a;
  --color-text-muted:     #64748b;
  --color-text-subtle:    #94a3b8;

  /* Semantic */
  --color-success:        #059669;
  --color-success-bg:     #ecfdf5;
  --color-danger:         #dc2626;
  --color-danger-bg:      #fef2f2;

  /* Arabic passage text */
  --color-arabic-text:    #292524;
  --color-arabic-bg:      #fafaf9;

  /* Borders */
  --color-border:         #e2e8f0;
  --color-border-strong:  #cbd5e1;
}

.dark {
  --color-primary:        #818cf8;
  --color-primary-hover:  #a5b4fc;
  --color-primary-fg:     #0f172a;
  --color-accent:         #fbbf24;
  --color-accent-hover:   #fcd34d;
  --color-accent-fg:      #0f172a;
  --color-background:     #0f172a;
  --color-surface:        #1e293b;
  --color-surface-raised: #0f172a;
  --color-text:           #f8fafc;
  --color-text-muted:     #94a3b8;
  --color-text-subtle:    #64748b;
  --color-success:        #34d399;
  --color-success-bg:     #064e3b;
  --color-danger:         #f87171;
  --color-danger-bg:      #7f1d1d;
  --color-arabic-text:    #e7e5e4;
  --color-arabic-bg:      #1c1917;
  --color-border:         #334155;
  --color-border-strong:  #475569;
}
```

### Typography Tokens

```css
:root {
  --font-sans:   'Plus Jakarta Sans', system-ui, sans-serif;  /* English UI */
  --font-arabic: 'Cairo', 'Arabic Typesetting', serif;        /* Bible passages */

  --text-xs:   0.75rem;   /* 12px — labels, badges */
  --text-sm:   0.875rem;  /* 14px — body small */
  --text-base: 1rem;      /* 16px — body */
  --text-lg:   1.125rem;  /* 18px — body large */
  --text-xl:   1.25rem;   /* 20px — subheadings */
  --text-2xl:  1.5rem;    /* 24px — headings */
  --text-3xl:  1.875rem;  /* 30px — page titles */
  --text-4xl:  2.25rem;   /* 36px — hero headings */

  --arabic-text-base: 1.25rem;  /* 20px — minimum for Arabic legibility */
  --arabic-text-lg:   1.5rem;   /* 24px — comfortable reading size */
  --arabic-text-xl:   1.75rem;  /* 28px — prominent passage display */
}
```

### Spacing & Radius Tokens

```css
:root {
  --radius-sm:  0.375rem;  /* 6px  — badges, small chips */
  --radius-md:  0.75rem;   /* 12px — buttons, inputs */
  --radius-lg:  1rem;      /* 16px — cards */
  --radius-xl:  1.5rem;    /* 24px — modals, bottom sheets */
  --radius-full: 9999px;   /* pills, avatars */

  --touch-target: 44px;    /* minimum interactive element size (kid screens) */
}
```

---

## Component Entities

Each entity describes a UI component: its visual purpose, data it consumes, states, and variants.

---

### ReadingCard

**Purpose**: The primary kid-facing component showing today's Bible reading assignment.

**Fields**:
- `bookName: string` — display name of the Bible book (Arabic)
- `reference: string` — e.g., "Genesis 1:1-10"
- `isCompleted: boolean` — drives completion state
- `hasAttempted: boolean` — drives quiz state
- `hasQuiz: boolean` — shows quiz badge when true

**States**:
| State | Visual |
|-------|--------|
| Default | Indigo gradient header, amber "Today's Reading" badge, white card body |
| Completed | Success green overlay, checkmark icon, "Completed!" label |
| Has-quiz | Amber "Quiz Available" badge in header |

**Constraints**: Min height 200px. Header gradient uses `--color-primary` to `--color-primary-hover`.
The book name renders right-to-left in `--font-arabic`.

---

### BiblePassage

**Purpose**: Renders Arabic Bible verses with proper RTL typography and verse number highlighting.

**Fields**:
- `verses: string[]` — raw verse strings containing inline verse numbers
- `className?: string` — optional override

**States**: Single state — always rendered in reading mode (no editing).

**Typography Rules**:
- Container: `dir="rtl"`, `font-family: --font-arabic`, `font-size: --arabic-text-lg`
- Verse numbers: smaller, colored with `--color-primary`, positioned inline (not superscript)
- Line height: minimum 2.0 for Arabic legibility
- Background: `--color-arabic-bg`; text: `--color-arabic-text`

---

### QuizCard

**Purpose**: Displays a single quiz question with selectable answer options and result feedback.

**Fields**:
- `question: Question` — {id, question, options, score, correctCount}
- `selectedAnswers: string[]` — currently selected option IDs
- `quizResult: QuizResult | null` — null until submitted
- `onToggle: (optionId: string) => void`
- `disabled: boolean`

**States**:
| State | Visual |
|-------|--------|
| Idle | White card, outlined option buttons |
| Option selected | Primary-tinted option button |
| Correct answer shown | Green-tinted option, CheckCircle2 icon |
| Wrong answer shown | Red-tinted option, XCircle icon |
| Quiz submitted | All options disabled |

**Constraints**: Min touch target per option: `--touch-target` (44px height). Score badge uses
`--color-accent` background.

---

### ProgressRing

**Purpose**: Circular SVG progress indicator shown on kid profile and stats.

**Fields**:
- `value: number` — 0–100 percentage
- `size?: 'sm' | 'md' | 'lg'` — defaults to 'md'
- `label?: string` — center label (e.g., "75%")
- `color?: 'primary' | 'accent' | 'success'`

**States**: Animated fill on mount (Framer Motion, 600ms spring).

---

### KidSummaryTile

**Purpose**: Admin dashboard card representing one kid's status.

**Fields**:
- `kidName: string`
- `kidId: string`
- `readToday: boolean`
- `score: number`
- `className?: string`
- `onTap: () => void` — navigates to kid detail

**States**:
| State | Visual |
|-------|--------|
| Read today | Success green indicator dot, "Read" badge |
| Not read today | Amber indicator dot, "Pending" badge |

**Constraints**: Min height `--touch-target`. Avatar shows initials with `--color-primary` background.

---

### StatCard

**Purpose**: Admin dashboard metric tile.

**Fields**:
- `label: string`
- `value: string | number`
- `trend?: 'up' | 'down' | 'neutral'`
- `icon: LucideIcon`
- `variant?: 'default' | 'success' | 'warning'`

---

### ConfirmDialog

**Purpose**: Confirmation modal for destructive admin actions.

**Fields**:
- `open: boolean`
- `title: string`
- `description: string`
- `confirmLabel: string` — e.g., "Delete Kid"
- `onConfirm: () => void`
- `onCancel: () => void`
- `variant: 'danger' | 'warning'`

**Constraints**: Uses shadcn/ui Dialog. Confirm button uses `--color-danger` background.
Cancel button is secondary/outlined. Confirm is visually separated from cancel (right-aligned).

---

### AppLogo

**Purpose**: Brand header component used in all page headers.

**Fields**:
- `size?: 'sm' | 'md' | 'lg'`
- `showText?: boolean`

**Visual**: BookOpen icon (Lucide) in `--color-primary` + "Bible Kids" wordmark in Plus Jakarta
Sans Bold. Compact form (icon only) for mobile headers.

---

### KidNav / AdminNav (redesigned)

**Purpose**: Bottom navigation bar for mobile; collapses to left rail on md+ breakpoints.

**KidNav items**: Dashboard (Home icon), History (Clock icon), Leaderboard (Trophy icon),
Profile (User icon).

**AdminNav items**: Dashboard (LayoutDashboard), Kids (Users), Assignments (BookOpen),
History (Clock), Leaderboard (Trophy).

**States**:
- Active: filled icon + label + `--color-primary` indicator bar above item
- Inactive: outlined icon + label + `--color-text-muted`
- Animated: active indicator slides between items (Framer Motion layoutId)

---

### OfflineBanner (redesigned)

**Purpose**: Persistent top-of-screen banner shown when network is unavailable.

**Fields**: None (reads `navigator.onLine` internally via existing hook).

**Visual**: Amber background (`--color-accent`), WifiOff icon (Lucide), "You are offline"
message, slides down on mount (Framer Motion, 200ms).

---

## Screen Inventory

| Screen | Route | Role | Key Components |
|--------|-------|------|----------------|
| Login | /login | All | AuthCard, PasswordInput |
| Register | /register | Kid | AuthCard, PasswordInput |
| Admin Register | /admin-register | Admin | AuthCard, PasswordInput |
| Verify Phone | /verify-phone | All | AuthCard, OTP input |
| Pending | /pending | All | StatusCard |
| Kid Dashboard | /kid/dashboard | Kid | ReadingCard, BiblePassage, QuizCard, ProgressRing |
| Kid History | /kid/history | Kid | HistoryList |
| Kid Leaderboard | /kid/leaderboard | Kid | LeaderboardList |
| Kid Profile | /kid/profile | Kid | ProfileCard, ProgressRing |
| Admin Dashboard | /admin | Admin | StatCard, KidSummaryTile list, ReadingCard |
| Admin Assignments | /admin/assignments | Admin | AssignmentForm, BibleBookPicker |
| Admin History | /admin/history | Admin | HistoryList |
| Admin Kids List | /admin/kids | Admin | KidSummaryTile list |
| Admin Kid Detail | /admin/kids/[type]/[id] | Admin | ProfileCard, ProgressRing, ConfirmDialog |
| Admin Leaderboard | /admin/leaderboard | Admin | LeaderboardList |
