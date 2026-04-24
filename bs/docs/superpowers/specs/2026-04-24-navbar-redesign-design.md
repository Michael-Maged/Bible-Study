# Navbar Redesign — Design Spec

**Date:** 2026-04-24  
**Status:** Approved

## Goal

Replace the existing bottom nav bars for Admin and Kid users with a floating card nav and a slim top header. Improve visual polish and mobile feel without changing the existing tab structure.

## What Changes

### New: `AppHeader` component

A shared top header rendered in both Admin and Kid dashboard layouts.

- Fixed to top, `z-50`, `backdrop-blur-md`, subtle bottom border
- Left: `AppLogo` (existing component, `size="sm"`)
- Right: logout icon button (same logout logic currently in `AdminNav`, extracted here)
- Kid layout also gets this header — logout is now accessible to both roles from the same place
- Height: ~52px; layouts must add `pt-[52px]` (or equivalent) to avoid content overlap

### Updated: `AdminNav`

- **Remove** the logout button (now lives in `AppHeader`)
- **Replace** the top-line active indicator with an animated indigo pill background
  - `motion.div` with `layoutId="admin-nav-pill"` animates position between tabs via spring
  - Active tab: `bg-primary` fill, white icon + label
  - Inactive tab: `text-muted-foreground`
- **Float** the nav above the screen floor:
  - `fixed bottom-0`, horizontal padding `px-3`, vertical padding `pb-[calc(env(safe-area-inset-bottom,8px)+8px)]`
  - Inner container: `bg-card rounded-[22px] shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-1.5 flex gap-1`
  - Each tab button: `flex-1 flex flex-col items-center gap-1 py-2 rounded-[16px] min-h-[48px]`
- Tabs unchanged: Home, Kids, Reading, History, Ranks (5 items)

### Updated: `KidNav`

- Same floating card treatment as `AdminNav`
  - `layoutId="kid-nav-pill"` (separate layoutId from admin)
  - Same sizing, rounding, shadow, padding
- Tabs unchanged: Today, History, Ranks, Me (4 items)
- Remove the inline `style={{ paddingBottom: 8 }}` — replaced by safe-area CSS

### Updated: Admin & Kid layouts

Both `app/(dashboard)/admin/layout.tsx` and `app/(dashboard)/kid/layout.tsx`:

- Add `AppHeader` at the top
- Add bottom padding to the page wrapper so content doesn't hide behind the floating nav: `pb-[calc(env(safe-area-inset-bottom,8px)+80px)]`

## Component Contracts

### `AppHeader`

```tsx
interface AppHeaderProps {
  showLogout?: boolean  // default true
}
```

Logout logic: same as current `AdminNav.handleLogout` — sign out Supabase, clear cookie, clear localStorage, clear caches, redirect to `/login`.

### `AdminNav` / `KidNav`

Props unchanged. Only internal implementation changes.

## Safe-Area Insets

- Nav bottom padding: `env(safe-area-inset-bottom, 8px)` — accounts for iPhone home bar
- Top header uses `env(safe-area-inset-top, 0px)` if needed (most phones don't need it for a fixed header at the top)
- `app/layout.tsx` currently exports `viewport` without `viewportFit: "cover"` — this must be added or `env(safe-area-inset-bottom)` returns 0 on all iPhones

## Animation

- Keep existing framer-motion dependency (already installed)
- Active pill: `layoutId` spring — `stiffness: 500, damping: 35` (same as current)
- No new animation dependencies

## Files Touched

| File | Change |
|------|--------|
| `components/AppHeader.tsx` | **New** |
| `components/AdminNav.tsx` | Remove logout, floating card style, pill animation |
| `components/KidNav.tsx` | Floating card style, pill animation, remove inline style |
| `app/(dashboard)/admin/layout.tsx` | Add `AppHeader`, bottom padding |
| `app/(dashboard)/kid/layout.tsx` | Add `AppHeader`, bottom padding |
| `app/layout.tsx` | Add `viewportFit: "cover"` to viewport export |

## Out of Scope

- No tab restructuring (labels, routes, icons stay the same)
- No unification into a single shared nav component (Admin and Kid remain separate files)
- No light-mode-specific changes
- No new dependencies
