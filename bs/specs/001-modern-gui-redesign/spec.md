# Feature Specification: Modern GUI Redesign

**Feature Branch**: `001-modern-gui-redesign`
**Created**: 2026-04-18
**Status**: Draft
**Input**: User description: "i want to build a new complete gui for this app. this app is a bible
study app for kids and adults supervising. it will have both english and arabic but the main is
english and the bible is always in arabic. i am open to any new colors and any new design."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kid Daily Reading Experience (Priority: P1)

A child opens the app and is immediately greeted by a welcoming, visually engaging dashboard. Their
daily Bible reading assignment is the centerpiece — clearly visible, easy to tap, and accompanied
by encouraging progress indicators. When they open a passage, the Arabic Bible text is large,
beautifully rendered, and easy to follow. The child knows exactly what to do next without any
adult help.

**Why this priority**: This is the core daily interaction for the primary users of the platform.
If kids cannot independently navigate to and read their assignment, the platform fails its purpose.

**Independent Test**: Launch the app as a kid user, arrive at the dashboard, tap the daily reading,
and read a passage — all without adult assistance. Delivers a fully functional kid reading flow.

**Acceptance Scenarios**:

1. **Given** a kid is logged in, **When** they open the app, **Then** their daily reading assignment
   is the first prominent element they see, with a clear call-to-action to begin reading.
2. **Given** a kid taps a reading assignment, **When** the passage opens, **Then** the Arabic Bible
   text is displayed right-to-left in a legible size with no layout overflow or broken characters.
3. **Given** a kid completes a reading, **When** they mark it done, **Then** a visible progress
   update confirms their achievement and encourages continued reading.
4. **Given** a kid is on any screen, **When** they need to navigate, **Then** all tappable elements
   are large enough to tap comfortably without accidentally hitting adjacent items.

---

### User Story 2 - Admin At-a-Glance Supervision (Priority: P2)

An adult supervisor (parent or teacher) opens the app to check on their kids. The admin dashboard
gives an immediate overview of all kids — who has read today, who is behind, and who needs
approval. Key actions are prominent and clearly labeled. Destructive actions (removing a kid,
banning an account) are visually separated from safe actions and require confirmation.

**Why this priority**: Admins need confidence that the platform gives them control and visibility.
A confusing admin UI leads to missed oversight and erodes trust in the platform.

**Independent Test**: Log in as an admin, identify one kid's reading status for today, and approve
a pending user — all within 30 seconds. Delivers a functional admin supervision flow.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they open the dashboard, **Then** they see all
   supervised kids with each one's name, today's reading status, and a quick-action button.
2. **Given** an admin views the kid list, **When** a kid has not read today, **Then** that kid
   is visually distinguished (e.g., different indicator) from kids who have completed their reading.
3. **Given** an admin taps a destructive action (delete, ban), **When** the action is initiated,
   **Then** a confirmation dialog appears before the action executes.
4. **Given** a pending user is waiting for approval, **When** the admin opens the dashboard,
   **Then** pending approvals are surfaced in a visible, dismissible notification area.

---

### User Story 3 - Seamless Bilingual Navigation (Priority: P3)

A user moves naturally between English navigation menus and Arabic Bible passages. The transition
feels polished — Arabic text is properly right-to-left, font sizes are appropriate for sacred
texts, and no English UI element bleeds into the Arabic reading area. Users who read only English
feel the app is fully in English; users reading the Bible see proper Arabic rendering.

**Why this priority**: The dual-language nature is central to the platform's identity. Poor RTL
rendering or mixed-direction layouts will immediately feel broken and unprofessional.

**Independent Test**: Navigate from the English dashboard to a Bible passage, read three verses in
Arabic, and return to the dashboard — with no layout issues at any step.

**Acceptance Scenarios**:

1. **Given** any screen is displayed, **When** the screen contains UI copy (labels, buttons, menus),
   **Then** all copy is in English with left-to-right reading direction.
2. **Given** a Bible passage is open, **When** the Arabic text is rendered, **Then** all verse text
   flows right-to-left with no English characters breaking the direction or causing overflow.
3. **Given** a Bible passage is displayed alongside English navigation, **When** the user views the
   page, **Then** the English and Arabic sections are visually separated with clear layout boundaries.

---

### User Story 4 - Fast Load and Offline Resilience (Priority: P4)

The app loads quickly enough that kids do not lose interest before reaching their content. When a
kid or admin loses internet connection, the app clearly communicates the offline state and continues
to show previously loaded Bible passages without broken layouts or error screens.

**Why this priority**: Many families use this platform on mobile data or unreliable connections.
A slow or broken offline experience will cause drop-off and reduce daily engagement.

**Independent Test**: Load the app on a throttled mobile connection and time first meaningful
content appearance. Then toggle offline — previously viewed passages remain accessible and legible.

**Acceptance Scenarios**:

1. **Given** a user opens the app on a standard mobile connection, **When** the app loads,
   **Then** meaningful content (dashboard or reading) is visible within 3 seconds.
2. **Given** a user loses network connectivity, **When** any screen is displayed, **Then** an
   offline status banner appears and previously loaded content remains fully readable.
3. **Given** a user is offline and attempts to load new content, **When** the request fails,
   **Then** a friendly message explains the situation without showing a blank screen or error code.

---

### Edge Cases

- What happens when a kid has no assigned reading for today (new user, weekend, etc.)?
- How does the layout behave on very small screens (320px wide) with long Arabic passages?
- What does the admin dashboard show when there are zero kids assigned?
- How is the app rendered when the user's system language is Arabic — does it affect English UI?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The kid dashboard MUST display the daily reading assignment as the primary visual
  element above all other content.
- **FR-002**: All Bible passage text MUST be rendered in Arabic with right-to-left text direction
  at a minimum font size that ensures comfortable reading on mobile screens.
- **FR-003**: The admin dashboard MUST present all supervised kids in a single scrollable view
  with each kid's name and today's reading completion status visible without tapping.
- **FR-004**: Navigation MUST be role-differentiated — kid and admin users MUST see separate,
  non-overlapping navigation structures appropriate to their role.
- **FR-005**: The app MUST display an offline status banner whenever network connectivity is lost,
  on every screen.
- **FR-006**: All interactive elements on kid-facing screens MUST meet a minimum touch target size
  to prevent accidental taps on adjacent items.
- **FR-007**: All UI copy (labels, buttons, headings, instructions) MUST be in English; Bible
  content MUST always be in Arabic. No mixing of languages within a single UI element.
- **FR-008**: Progress toward daily reading goals MUST be visible on both the kid dashboard and
  the admin kid-detail view.
- **FR-009**: Destructive admin actions (delete, ban, remove) MUST require explicit confirmation
  before executing and MUST be visually separated from non-destructive actions.
- **FR-010**: The authentication screens (login, registration, phone verification, pending state)
  MUST be redesigned to match the new visual identity.
- **FR-011**: The color palette and visual identity MUST be cohesive across all screens and
  appropriate for a spiritual children's education platform.
- **FR-012**: Previously loaded Bible passages MUST remain accessible and fully readable when
  the user is offline.

### Key Entities

- **Screen**: A distinct full-page view in the app (e.g., kid dashboard, admin dashboard, Bible
  reading view, login, registration, kid profile, admin kid-detail).
- **Navigation Structure**: The role-specific menu, tabs, or sidebar that allows users to move
  between screens.
- **Reading Card**: A visual component that represents one Bible reading assignment, showing the
  passage reference, completion state, and entry point to reading.
- **Progress Indicator**: A visual element (e.g., bar, badge, icon) that communicates how much
  of a reading goal has been completed.
- **Kid Summary Tile**: A card on the admin dashboard representing one kid, showing name, avatar
  (or initials), and today's reading status.
- **Offline Banner**: A persistent, non-blocking UI element that appears when network is
  unavailable and disappears when connectivity is restored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of kids in usability testing complete their daily reading task without
  requesting adult assistance.
- **SC-002**: The app's first meaningful content (dashboard or reading view) appears within
  3 seconds for users on a standard mobile data connection.
- **SC-003**: An admin can identify a specific kid's reading status for today within 10 seconds
  of opening the admin dashboard.
- **SC-004**: Arabic Bible passages are rated "comfortable to read" by at least 85% of test
  readers in a post-session survey.
- **SC-005**: 100% of previously loaded Bible passages remain accessible with correct layout
  when the user goes offline.
- **SC-006**: 95% of new users successfully complete the login or registration flow on their
  first attempt without requesting help.
- **SC-007**: The redesigned app receives a visual consistency rating of 4/5 or higher in
  stakeholder review across all role views (kid, admin).

## Assumptions

- The redesign covers all existing screens: kid dashboard, reading view, admin dashboard, admin
  kid-detail, login, registration, phone verification, and pending approval. No new screens are
  added in this feature.
- The three existing roles (kid, admin, superuser) are unchanged; superuser shares the admin UI.
- The Arabic Bible text data is provided by the existing content layer — the redesign changes
  display only, not data sourcing.
- The app continues to function as a Progressive Web App (installable, offline-capable); offline
  behavior is redesigned, not removed.
- Mobile-first design is the priority. Desktop is a supported secondary breakpoint but is not
  the primary design target.
- The specific color palette will be proposed and selected during the design/planning phase.
  The spec does not prescribe exact colors — only that they must be cohesive and contextually
  appropriate for a spiritual children's education platform.
- English is the sole language for all UI chrome (navigation, labels, buttons, error messages).
  Arabic is used exclusively for Bible passage content.
- The existing authentication logic (session management, role-based redirects, OTP) is not
  changed by this feature — only the visual presentation is updated.
