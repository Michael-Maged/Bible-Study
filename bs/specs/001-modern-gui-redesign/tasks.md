---

description: "Task list for Modern GUI Redesign"
---

# Tasks: Modern GUI Redesign

**Input**: Design documents from `specs/001-modern-gui-redesign/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. Auth screens are grouped under US3 (Bilingual Navigation) since their
primary redesign concern is the bilingual layout and new design system integration.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and establish the design system foundation.
All Phase 2+ tasks depend on this phase being complete.

- [ ] T001 Install new npm dependencies: `npm install framer-motion lucide-react clsx tailwind-merge`
- [ ] T002 Initialize shadcn/ui: `npx shadcn@latest init` — select Default style, Slate base color, CSS variables enabled, alias `@/components/ui`
- [ ] T003 Add shadcn components: `npx shadcn@latest add button card badge dialog progress avatar tabs separator`
- [ ] T004 Configure Plus Jakarta Sans and Cairo fonts via `next/font/google` in `app/layout.tsx` — set CSS variables `--font-sans` and `--font-arabic` on `<body>`
- [ ] T005 Replace `app/globals.css` with design system tokens from `specs/001-modern-gui-redesign/data-model.md` — all `--color-*`, `--font-*`, `--radius-*`, `--touch-target` tokens for both light and dark modes
- [ ] T006 [P] Create `lib/utils.ts` with `cn()` helper using `clsx` and `tailwind-merge`

**Checkpoint**: Run `npm run dev` — app loads, shadcn Button renders, Plus Jakarta Sans applied globally. Validate per `quickstart.md` checklist.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared components used across ALL user stories. Must complete before any
user story phase begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 [P] Create `components/AppLogo.tsx` — BookOpen (Lucide) + "Bible Kids" wordmark; props: `size?: 'sm'|'md'|'lg'`, `showText?: boolean`, `className?: string`; uses `--color-primary`
- [ ] T008 [P] Redesign `components/OfflineBanner.tsx` — WifiOff icon (Lucide), amber background (`--color-accent`), Framer Motion slide-down animation (200ms), renders null when online
- [ ] T009 [P] Redesign `components/LoadingScreen.tsx` — full-screen centered spinner using `--color-primary`, AppLogo above spinner, smooth fade-in
- [ ] T010 [P] Redesign `components/MessageBox.tsx` — success/error variants using `--color-success` / `--color-danger` tokens; Lucide CheckCircle2 / XCircle icons; replaces emoji icons

**Checkpoint**: Import and render each foundational component in isolation — all four render
without errors and match design token colors.

---

## Phase 3: User Story 1 — Kid Daily Reading Experience (Priority: P1) 🎯 MVP

**Goal**: A kid opens the app and independently completes their daily reading and quiz.

**Independent Test**: Log in as a kid user → see today's reading as the primary screen element →
tap to read → Arabic passage renders correctly RTL → answer all quiz questions → submit and see
score. Complete end-to-end without adult help.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create `components/kid/ReadingCard.tsx` — header gradient (indigo), book name in Cairo RTL, English reference badge in `--color-primary`, completion overlay with CheckCircle2 icon; props per `contracts/component-contracts.md`
- [ ] T012 [P] [US1] Create `components/kid/BiblePassage.tsx` — `dir="rtl"`, Cairo font at `--arabic-text-lg`, verse numbers colored with `--color-primary`, `--color-arabic-bg` background, min line-height 2.0; props: `verses: string[]`
- [ ] T013 [P] [US1] Create `components/kid/ProgressRing.tsx` — SVG circular progress (0–100), animated fill on mount via Framer Motion spring (600ms), center label, size variants sm/md/lg, color variants primary/accent/success
- [ ] T014 [P] [US1] Create `components/kid/QuizCard.tsx` — question header with index badge (`--color-primary`), score badge (`--color-accent`), option buttons with 44px min height, selected/correct/wrong states per contracts; uses shadcn Button primitives
- [ ] T015 [US1] Redesign `components/KidNav.tsx` — 4 items: Dashboard/History/Leaderboard/Profile using Lucide icons (Home/Clock/Trophy/User); active state: filled icon + `--color-primary` indicator bar via Framer Motion layoutId; 44px min tap target per item; desktop: left sidebar
- [ ] T016 [US1] Redesign `app/(dashboard)/kid/dashboard/page.tsx` — split into Server Component (data fetch via Supabase server client) + Client `KidDashboardView.tsx` component; compose ReadingCard + BiblePassage + QuizCard + ProgressRing; use OfflineBanner + KidNav; remove all hardcoded #59f20d references
- [ ] T017 [P] [US1] Create `app/(dashboard)/kid/dashboard/KidDashboardView.tsx` — client component holding all interactive state (selectedAnswers, quizResults, completing); extracted from current page.tsx; accepts initial data as props from Server Component

**Checkpoint**: Kid dashboard fully functional — reading loads, Arabic passage renders RTL in
Cairo font, quiz submits and shows score, KidNav navigates to other kid routes. OfflineBanner
appears when network toggled off in DevTools.

---

## Phase 4: User Story 2 — Admin At-a-Glance Supervision (Priority: P2)

**Goal**: Admin opens app, immediately sees all kids' status, acts on pending approvals.

**Independent Test**: Log in as admin → admin dashboard shows all supervised kids with today's
reading status visible per tile → identify one kid who has not read → tap their tile to view
detail → trigger a destructive action → confirm dialog appears and blocks action until confirmed.

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create `components/admin/StatCard.tsx` — label, value, trend indicator, Lucide icon, variant (default/success/warning); uses shadcn Card primitive; value uses `--color-primary` or variant color
- [ ] T019 [P] [US2] Create `components/admin/KidSummaryTile.tsx` — Avatar (shadcn) showing initials with `--color-primary` bg, kid name, today status badge (green "Read" / amber "Pending"), optional score; min height 44px; tappable row navigates to kid detail; props per contracts
- [ ] T020 [P] [US2] Create `components/admin/ConfirmDialog.tsx` — shadcn Dialog wrapper; title, description, confirmLabel, cancelLabel; danger variant uses `--color-danger`; loading state disables buttons + shows spinner; backdrop click disabled when loading; props per contracts
- [ ] T021 [US2] Redesign `components/AdminNav.tsx` — 5 items: Dashboard/Kids/Assignments/History/Leaderboard using Lucide icons (LayoutDashboard/Users/BookOpen/Clock/Trophy); same animation pattern as KidNav; desktop left sidebar
- [ ] T022 [US2] Redesign `app/(dashboard)/admin/page.tsx` — split into Server Component (initial stats + today's reading via server client) + Client `AdminDashboardView.tsx`; compose StatCard grid + KidSummaryTile list + ReadingCard for today; AdminNav + OfflineBanner
- [ ] T023 [P] [US2] Create `app/(dashboard)/admin/AdminDashboardView.tsx` — client component holding analytics state; accepts initial stats/reading as props from Server Component; remove all hardcoded #59f20d references
- [ ] T024 [US2] Redesign `app/(dashboard)/admin/kids/page.tsx` — full KidSummaryTile list with search/filter header (Lucide Search icon), AdminNav, OfflineBanner; server-fetched kids list as initial props
- [ ] T025 [US2] Redesign `app/(dashboard)/admin/kids/[type]/[id]/page.tsx` — kid detail view with ProfileCard (avatar, name, class), ProgressRing for reading rate, reading history list; ConfirmDialog for destructive actions (ban/delete); AdminNav

**Checkpoint**: Admin dashboard shows kid tiles with correct read/pending badges, StatCards show
real stats, ConfirmDialog blocks destructive action until confirmed. AdminNav active state
correct per route.

---

## Phase 5: User Story 3 — Seamless Bilingual Navigation (Priority: P3)

**Goal**: All 5 auth screens redesigned; English UI and Arabic Bible text coexist without layout
issues on any screen.

**Independent Test**: Navigate login → register → dashboard → Bible passage → return to
dashboard. Verify: all English labels are LTR, all Arabic Bible text is RTL, no overflow or
mixed-direction issues at any step. Test on both mobile (375px) and desktop (1280px).

### Implementation for User Story 3

- [ ] T026 [P] [US3] Redesign `app/(auth)/login/page.tsx` — AuthCard layout (centered card, AppLogo above, max-w-sm); Plus Jakarta Sans; `<PasswordInput>` with eye toggle; primary Button for submit; link to /register; OfflineBanner; removes all hardcoded #59f20d
- [ ] T027 [P] [US3] Redesign `app/(auth)/register/RegisterPage.tsx` — same AuthCard layout; name + phone + password fields; `<PasswordInput>`; primary Button; link to /login
- [X] T028 [P] [US3] Redesign `app/(auth)/admin-register/AdminRegisterPage.tsx` — same AuthCard layout; admin-specific fields (name, email, phone, class/tenant); `<PasswordInput>`
- [X] T029 [P] [US3] Redesign `app/(auth)/verify-phone/page.tsx` — OTP input field (6 digits); numbered boxes with `--color-primary` active border; verify Button; resend code link
- [X] T030 [P] [US3] Redesign pending approval page (check `app/(auth)/` for existing pending route; if `app/(auth)/pending/` does not exist create `app/(auth)/pending/page.tsx`) — StatusCard with Clock icon (Lucide), amber accent, "Waiting for approval" message, sign-out link
- [X] T031 [US3] Update `components/PasswordInput.tsx` — apply new design tokens (border radius `--radius-md`, border `--color-border`, focus ring `--color-primary`); keep existing show/hide toggle logic unchanged

**Checkpoint**: All 5 auth screens match new design language. Navigate login→register and
back — consistent typography and spacing. PasswordInput show/hide toggle still works.
No Arabic text present on auth screens (English only).

---

## Phase 6: User Story 4 — Fast Load and Offline Resilience (Priority: P4)

**Goal**: App loads meaningful content in under 3 seconds on 4G; offline previously-loaded
content is accessible with correct layout.

**Independent Test**: Chrome DevTools → Network → "Fast 4G" throttle → hard reload kid
dashboard — time to first meaningful content ≤ 3s. Then toggle "Offline" — dashboard still
shows last reading with correct layout, OfflineBanner appears, no broken screens.

### Implementation for User Story 4

- [X] T032 [US4] Audit all redesigned pages for `"use client"` directives — any page that only needs interactivity in a sub-section MUST be split: Server Component page + Client leaf component (pattern: same as T016/T022)
- [X] T033 [P] [US4] Verify `app/layout.tsx` uses `next/font` for both Plus Jakarta Sans and Cairo — no `<link>` to Google Fonts CDN remains in layout (fonts must be self-hosted via next/font for zero layout shift)
- [X] T034 [P] [US4] Audit `app/globals.css` — confirm `font-display: swap` is NOT needed (next/font handles this automatically); remove any manual @import for Spline Sans or Material Symbols that were replaced
- [ ] T035 [US4] Test offline scenario in browser: navigate to kid dashboard while online → toggle offline in DevTools → confirm OfflineBanner appears, previously-loaded reading still visible with correct Cairo RTL rendering, no blank screens
- [X] T036 [P] [US4] Verify `npm run build` passes with zero TypeScript errors and zero ESLint errors after all phase 3–5 tasks complete
- [X] T037 [P] [US4] Run `npm run lint` — fix any unused imports or `any` type violations introduced during redesign

**Checkpoint**: Build passes cleanly, offline reading works with correct layout, font loading
shows no layout shift (verify with Chrome Lighthouse CLS score < 0.1).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Remaining 6 screens not covered by US1–US3 core flows, plus final cross-cutting
polish. These screens share components already built — they are layout/composition tasks.

- [X] T038 [P] Redesign `app/(dashboard)/kid/history/page.tsx` — history list using Card + Badge components; reading date, book name (Arabic, Cairo), completion badge; KidNav + OfflineBanner; Server Component with client list
- [X] T039 [P] Redesign `app/(dashboard)/kid/leaderboard/page.tsx` — ranked list with Avatar (shadcn), Trophy icon (Lucide) for top 3; current user highlighted with `--color-primary` border; KidNav + OfflineBanner
- [X] T040 [P] Redesign `app/(dashboard)/kid/profile/page.tsx` — Avatar (large, initials), ProgressRing for reading completion rate, stat grid (total reads, total score, streak); KidNav + OfflineBanner
- [X] T041 [P] Redesign `app/(dashboard)/admin/assignments/page.tsx` — assignment creation form with CustomSelect for Bible book; verse range inputs; submit Button (primary); AdminNav + OfflineBanner; keep existing action functions
- [X] T042 [P] Redesign `app/(dashboard)/admin/history/page.tsx` — history list with date filter header, Card per assignment entry, AdminNav + OfflineBanner
- [X] T043 [P] Redesign `app/(dashboard)/admin/leaderboard/page.tsx` — same ranked list pattern as kid leaderboard but with admin context (shows all kids across classes); AdminNav + OfflineBanner
- [X] T044 Update `components/CustomSelect.tsx` — apply new design tokens (border `--color-border`, focus `--color-primary`, radius `--radius-md`); keep existing logic unchanged
- [ ] T045 Final cross-browser check — open app on mobile Chrome (Android) and Safari (iOS simulation via DevTools); verify Arabic RTL, bottom nav height, touch targets on all redesigned screens
- [X] T046 Validate `npm run build && npm run lint` pass with zero errors — final gate before merge

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 1 + 2 — no dependency on US2/US3/US4
- **US2 (Phase 4)**: Depends on Phase 1 + 2 — no dependency on US1/US3/US4
- **US3 (Phase 5)**: Depends on Phase 1 + 2 — no dependency on US1/US2/US4
- **US4 (Phase 6)**: Depends on Phase 3 + 4 + 5 being complete (audits all redesigned pages)
- **Polish (Phase 7)**: Depends on Phase 3 + 4 + 5 + 6

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2 — can start immediately after foundation
- **US2 (P2)**: Independent after Phase 2 — can run in parallel with US1
- **US3 (P3)**: Independent after Phase 2 — can run in parallel with US1/US2
- **US4 (P4)**: Depends on US1 + US2 + US3 being complete (audits their output)

### Within Each User Story

- Parallel components ([P] marked) can all be built simultaneously
- Navigation component (KidNav/AdminNav) must complete before the page redesigns that use it
- Server Component page must complete before Client View component can be integrated

### Parallel Opportunities

All tasks marked `[P]` within a phase can run simultaneously.

**Maximum parallel batch (Phase 3)**:
- T011 ReadingCard + T012 BiblePassage + T013 ProgressRing + T014 QuizCard — all independent components
- Then T015 KidNav (depends on Lucide icons from T001) → then T016 + T017 together

**Maximum parallel batch (Phase 4)**:
- T018 StatCard + T019 KidSummaryTile + T020 ConfirmDialog + T021 AdminNav — all independent

---

## Parallel Example: User Story 1

```bash
# Launch all US1 leaf components together (T011-T014):
Task: "Create components/kid/ReadingCard.tsx"
Task: "Create components/kid/BiblePassage.tsx"
Task: "Create components/kid/ProgressRing.tsx"
Task: "Create components/kid/QuizCard.tsx"

# Then (T015):
Task: "Redesign components/KidNav.tsx"

# Then (T016 + T017 together):
Task: "Redesign app/(dashboard)/kid/dashboard/page.tsx (Server Component)"
Task: "Create app/(dashboard)/kid/dashboard/KidDashboardView.tsx (Client Component)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: US1 — Kid Daily Reading (T011–T017)
4. **STOP and VALIDATE**: Log in as kid, complete full reading + quiz flow in browser
5. Demo: Kid experience fully redesigned with new Indigo + Amber design system

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Kid reading redesigned → **Demo kid experience** ✅
3. US2 → Admin supervision redesigned → **Demo admin experience** ✅
4. US3 → Auth screens + bilingual polish → **Demo full auth flow** ✅
5. US4 + Polish → Performance + remaining screens → **Production ready** ✅

### Parallel Team Strategy (if multiple developers)

1. Team completes Phase 1 + 2 together
2. Once Phase 2 done:
   - Developer A: US1 (kid components + dashboard)
   - Developer B: US2 (admin components + dashboard)
   - Developer C: US3 (auth screens)
3. Once US1 + US2 + US3 done: Developer A runs US4 audit
4. Polish screens distributed across team

---

## Notes

- `[P]` tasks = different files, no mutual dependencies — safe to parallelize
- `[Story]` label maps to spec.md user stories (US1=P1, US2=P2, US3=P3, US4=P4)
- All hardcoded `#59f20d`, `#f6f8f5`, `#162210` color values MUST be removed from redesigned files
- Keep all existing Supabase action functions (`actions.ts` files) completely unchanged
- Keep all existing API routes (`app/api/`) completely unchanged
- Keep `public/sw.js`, `hooks/useOfflineData.ts`, `utils/offlineCache.ts` completely unchanged
- Only the presentation layer changes — routes, data fetching logic, and business logic are frozen
- Commit after each checkpoint (end of each phase)
- Stop at any checkpoint to validate the story independently before continuing
