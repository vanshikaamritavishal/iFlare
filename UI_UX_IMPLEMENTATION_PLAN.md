# iFLARE UI/UX Implementation Plan

**This file is the persistent source of truth for the UI/UX overhaul.** It survives context
resets. At the start of any new session, read [`CLAUDE.md`](./CLAUDE.md) and then this file before
touching anything.

Work is phase-by-phase. Do not start a phase because its code happens to be nearby — implement only
the phase asked for, then update the "Status log" at the bottom of this file.

---

## 1. Context

The authenticated shell (`app/(app)/` route group, `AppSidebar`, extracted flare components) landed
recently, but a batch of UX problems was specified on top of it:

- Three different background treatments for one product (masked grid on the landing page, a diagonal
  gradient in the app and auth screens, flat slate on the info pages).
- `about` / `contact` / `feedback` / `privacy` / `terms` live **outside** `(app)`, so a signed-in
  user opening one from the sidebar lost the sidebar entirely, and Back sent them to the public
  landing page.
- The mobile sidebar trigger was a small ghost icon, and the mobile sheet is rendered with
  `[&>button]:hidden` (`components/ui/sidebar.jsx:170`) — so once open there was **no visible close
  control at all**. No swipe support.
- The onboarding tour is a full-screen blurred modal that hides the app it describes.
- Notifications are a modal reached through a `sessionStorage` handoff, and a user is notified about
  their own flare.
- Interest UI is duplicated with inconsistent styling, limited to a fixed 12-item list, and can't
  accept a user's own interest.
- Registration is 5 steps; it must be 4, with interests and bio combined after OTP.

Outcome wanted: one consistent mobile-first visual system, a shell that never disappears, and a
single reusable interest component backed by persistable custom interests.

---

## 2. Product terminology (enforce in all copy)

- The product is **iFLARE**.
- An individual meetup is a **flare** — "join a flare", "create a flare".
- Never call an individual meetup an "iFlare". *(Existing copy still violates this in places —
  cleaned up in Phase 6.)*

---

## 3. Decisions taken (confirmed with the user)

1. **`/api/auth/signup/start` validation will be relaxed** so `interests` is optional (defaults to
   `[]`). Deliberate, explicitly-identified backend change — the only way to get a true 4-step order
   with interests after OTP. OTP mechanics untouched. *(Phase 4.)*
2. **Registration step 4: interests required (min 3), bio optional, no "Skip for now" button.**
   `Continue` is the single primary action, enabled once 3 interests are selected; it saves whatever
   bio was typed, including an empty one. *This overrides the original brief*, which asked for a Skip
   secondary action and for skipping to still allow entry to `/flares`. Accepted consequence: a user
   cannot reach `/flares` without interests — which also guarantees the interest-matched feed is
   never empty by construction. No backend change needed for this: `PUT /user/settings` already
   treats `bio` as optional and already enforces `interests.length >= 3` when interests are supplied
   (`app/api/[[...path]]/route.js:1102`).
3. **Custom interests persist per university** — new `interests` collection stamped with the
   creator's `emailDomain`, suggested only to students of that domain, consistent with the existing
   `hostEmailDomain` scoping model. *(Phase 3.)*
4. **Avatar upload is out of scope.** `users` has no avatar field and the stack has no file storage;
   the brief says "if supported by the existing implementation" — it isn't. Step 4 ships with bio +
   interests only.
5. **Campus locations stay as-is**, with a documented TODO that they must become
   university-specific (currently one global list in `lib/campusLocations.js`). *(Phase 6.)*

---

## 4. Phase overview

| Phase | Theme | Backend? | Depends on | Status |
| ----- | ----- | -------- | ---------- | ------ |
| **1** | Visual foundation + app shell + mobile nav | No | — | ✅ **Complete** |
| **2** | Onboarding popover + notifications page + self-notify fix | No | 1 | ✅ **Complete** |
| **3** | Shared interest chip/selector + custom-interest persistence | **Yes** | 1 | ✅ **Complete** |
| **4** | Registration → 4 steps | **Yes** | 3 | ✅ **Complete** |
| **5** | Create-flare step 1 compaction + step 2 time/date | No | 3 | ✅ **Complete** |
| **6** | Interest consistency audit + docs/cleanup | No | 3, 4, 5 | ⬜ Not started |

---

## 5. Phase details

### PHASE 1 — Visual foundation, app shell, mobile navigation ✅ COMPLETE

Delivered. See the status log in §6 for what changed and what was verified.

Scope was: one background treatment everywhere; brand prominent top-left; extract `AppShell`;
info pages keep the authenticated shell; prominent animated mobile menu button; swipe gestures;
Enter-key audit.

### PHASE 2 — Onboarding popover + notifications as a page ✅ COMPLETE

Delivered. See the status log in §6.

Scope was:

- **`components/OnboardingWalkthrough.js`** — reuse, don't replace. Drop the full-screen
  `bg-black/70 backdrop-blur-sm`; render a compact panel anchored near a corner (bottom-right on
  desktop, bottom-inset on mobile) so the app stays clearly visible and unblurred. Slide 0 becomes a
  consent prompt — "Want a quick tour?" with **Yes, show me** / **No thanks**. Clicking outside
  closes; Skip closes/finishes. Keep the existing per-user `iflare_onboarding_seen:<id>` key so it
  stays new-users-only, and keep Escape-to-dismiss.
- **Notifications become a page**: new `app/(app)/notifications/page.js` reusing the list/permission
  UI already in `components/NotificationsPanel.js` and the existing `NotificationProvider` API
  (`markAsRead` / `markAllAsRead` / `clearAll`). The modal wrapper is what goes, not the list.
  - Sidebar item becomes a plain `Link`, retiring the `iflare_open_notifications` sessionStorage key
    and the `iflare:open-notifications` window event (`components/AppSidebar.js:100-109` and
    `app/(app)/flares/page.js:79-88`). The feed's bell becomes a link too.
- **Self-notification fix** — fix at provider level so every caller is safe: `notifyNewFlare`
  (`lib/NotificationProvider.js:107`) bails when the flare's host is the current user, and the
  incorrect call site in `app/(app)/flares/page.js` (`handleFlareCreated`) is removed. Notifications
  for *other* users must keep working.

### PHASE 3 — Shared interest system (**backend change**) ✅ COMPLETE

Delivered. See the status log in §6.

- `components/InterestChip.js` + `components/InterestSelector.js`:
  - text input that searches existing interests, suggestions below it,
  - selecting a suggestion adds a chip; every chip has an X to remove,
  - Enter creates a custom chip and **never** submits the surrounding form,
  - one chip style for built-in *and* custom interests — same background, text colour, border,
    selected and hover states. This fixes today's inconsistency, where `INTERESTS[].color`
    (`lib/interests.js:10-21`) recolours only known ids and leaves everything else grey.
- New `interests` collection: `{ id, name, emoji, emailDomain, createdBy, createdAt }`, unique on
  `{ id, emailDomain }`, index created in `ensureMigrated()` next to the existing ones.
- `GET /api/interests` — custom interests for the caller's `emailDomain`.
  `POST /api/interests` — slugify name → id, upsert, stamp domain + creator. Inline validation in
  the existing `handleRoute` style; no middleware.
- `users.interests[]` and `flares.interests[]` keep storing plain ids — **unchanged**.
- `lib/interests.js` gains a merge helper; the built-in list stays the static base.

### PHASE 4 — Registration → 4 steps (**backend change**) ✅ COMPLETE

Delivered. See the status log in §6.

University → Account → OTP → Personalisation.

- `STEPS` (`app/register/page.js:36`) becomes `['University', 'Account', 'Verify', 'Personalise']`;
  the old step-3 interest block merges into the final step alongside the bio, using the Phase 3
  selector.
- `/auth/signup/start` is called from step 2 with no `interests` (backend relaxed per decision 1);
  `/auth/signup/verify` still creates the account and issues the session exactly as today.
- Step 4: **≥3 interests required, bio optional** (still capped at `BIO_MAX_LENGTH` 300), one
  primary `Continue`, no Skip control. Saves `{ interests, bio }` via the existing
  `PUT /user/settings`, then lands on `/flares`. An empty bio is sent as `''`, matching how
  pre-bio accounts are already read (`user.bio || ''`).

### PHASE 5 — Create-flare steps ✅ COMPLETE

- **Step 1 fits one screen**: the always-visible 12-chip grid
  (`components/CreateFlareForm.js:261-286`) becomes the Phase 3 selector inside a `Popover`, and the
  "Need an idea?" block collapses — Continue stays reachable without scrolling. Multiple interests
  still allowed, selected ones clearly shown, interests data/API model unchanged.
- **Step 2 reorders to Time → Date** with improved controls built from existing shadcn primitives.
  `StartTimePreview` and the posted payload are unchanged.

### PHASE 6 — Audit + docs

- Sweep `FlareSearch`, `FlareCard`, `FlareDetailModal`, `profile`, `activity` onto the shared chip.
- Product terminology pass: "iFlare" → "flare" for individual meetups in user-facing copy.
- Document that campus locations must become university-specific, in `lib/campusLocations.js` and
  `CLAUDE.md`.
- Refresh `DEVELOPMENT.md` with the `interests` collection and the two new endpoints.

---

## 6. Status log

### Phase 1 — Visual foundation, app shell, mobile navigation — ✅ COMPLETE

**What it accomplished**

1. *One background everywhere.* Removed the landing page's masked grid overlay and replaced every
   `bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950` with the solid `bg-background`
   token. Landing, login, register, forgot-password, verify, the app shell and the info pages now
   share one surface. The sidebar keeps its own compatible shade — `--sidebar-background`
   (222.2 47.4% 11.2%) already differs from `--background` (222.2 84% 4.9%), so `globals.css` needed
   no change.
2. *Brand prominent top-left.* Two-tone `iFLARE` wordmark (slate `i` + orange `FLARE`) with the
   `Radar` mark, in the sidebar header on desktop and the mobile sticky bar. Removed the duplicate
   brand from the flares page header, which is now just the `Flares` title plus the bell.
3. *`components/AppShell.js` extracted* — sidebar, mobile header, content column, onboarding and
   swipe handling. `app/(app)/layout.js` is now a thin wrapper over it.
4. *Info pages keep the authenticated shell.* `InfoPageShell` picks chrome from the session rather
   than the route: signed in → full `AppShell`, sidebar and header intact, Back → `/flares`, public
   footer nav hidden (the sidebar already has those links). Signed out → the public page it always
   was, Back → `/`. Page content is untouched, so there's no duplication.
5. *Prominent, animated mobile menu button.* A 44px filled/bordered button, fixed at `z-[60]` so it
   sits **above** the sheet overlay, crossfading `Menu` ⇄ `X` on `openMobile` with matching
   `aria-label`/`aria-expanded`. This is also the only close control the mobile sheet has.
6. *Swipe gestures.* `components/SwipeToToggleSidebar.js` — right opens, left closes, mobile only.

**Files changed**

| File | Change |
| ---- | ------ |
| `UI_UX_IMPLEMENTATION_PLAN.md` | **New** — this file |
| `components/AppShell.js` | **New** — extracted authenticated chrome + mobile toggle + brand |
| `components/SwipeToToggleSidebar.js` | **New** — swipe-to-open/close, with guards |
| `app/(app)/layout.js` | Reduced to a thin `AppShell` wrapper |
| `components/InfoPageShell.js` | Session-aware chrome; Back destination; lazy `AppShell` import |
| `components/AppSidebar.js` | Two-tone brand lockup |
| `app/page.js` | Grid backdrop removed; `bg-background` |
| `app/(app)/flares/page.js` | Duplicated desktop brand removed; `Flares` title at all widths |
| `app/login/page.js`, `app/register/page.js`, `app/forgot-password/page.js`, `app/verify/page.js` | Gradient → `bg-background` |

**Implementation decisions**

- *Session-aware shell over duplicated routes.* The info routes can't move into `(app)` — the
  logged-out landing footer links to them and `(app)` has no auth guard, so public visitors would
  get a sidebar full of links that bounce to `/login`. Deciding chrome from `localStorage.iflare_user`
  (the same check every authenticated page already makes) fixes the bug with no route changes and no
  duplicated content.
- *Three-state session, not two.* Chrome resolves after mount, so `session` is
  `unknown` → `in`/`out`. While unknown, the Back link is withheld rather than pointed at a guess.
- *`AppShell` is lazily imported in `InfoPageShell`* (`next/dynamic`, `ssr: false`) — it only ever
  renders after mount for signed-in users, and this kept the sidebar/sheet bundle off the public
  pages (`/about` First Load JS: 138 kB → 96.8 kB).
- *The mobile toggle is `fixed`, not in the header flow.* `components/ui/sidebar.jsx` hides the
  sheet's own close button (`[&>button]:hidden`), so a toggle laid out in the header would be buried
  under the overlay once open. Fixed at `z-[60]` keeps it tappable and makes the X the obvious close.
  The header reserves an 11-unit spacer so nothing shifts. `components/ui/sidebar.jsx` was **not**
  modified — it's generated shadcn.
- *Swipe thresholds, chosen to never steal another gesture:* ≥60px horizontal travel, `|dx| ≥ 2·|dy|`,
  under 600ms, single touch only; the gesture is abandoned as soon as vertical drift exceeds 12px and
  dominates. It never starts inside `INPUT`/`TEXTAREA`/`SELECT`/`contenteditable`, inside anything
  marked `data-no-swipe`, or inside a horizontally scrollable ancestor (chip rows, venue grid).
  All listeners are `passive` and `preventDefault()` is never called, so native scrolling is
  untouched.

**Tests / checks performed**

- `next build` — compiles successfully, all 18 routes generated, no new warnings. (It needs
  `RESEND_API_KEY` set to anything, see Known issues.)
- Ran `next start` and verified over HTTP:
  - `/` — grid backdrop markup gone (0 occurrences), root is
    `class="relative min-h-screen overflow-hidden bg-background"`.
  - `/about` signed out — public chrome with the footer nav present.
  - `/flares` — exactly one brand lockup per breakpoint (sidebar at md+, sticky bar below md), the
    `Open menu` button present, header title is `<h1>Flares</h1>`.
  - `/settings` — same shell.
- `grep` confirmed no `bg-gradient-to-br` page backgrounds remain and no page under `app/(app)/`
  renders its own brand lockup.
- Bundle check: public info pages 96.8 kB First Load JS (down from 138 kB before the lazy import).

**Known issues / notes for later**

- `next build` fails at page-data collection with `Missing API key. Pass it to the constructor
  new Resend(...)` when `RESEND_API_KEY` is unset, because `app/api/[[...path]]/route.js:108`
  constructs the client at module scope. **Pre-existing, unrelated to Phase 1** (there's no `.env` in
  this checkout). Workaround for local builds: `RESEND_API_KEY=anything next build`. Worth making the
  client lazy at some point.
- Signed-in visitors to an info page see public chrome for one frame before the shell mounts, since
  the session is only knowable client-side. Accepted; the alternative is a blank page.
- Swipe gestures are touch-only by design — no mouse-drag equivalent on desktop, where the sidebar is
  always visible anyway.
- **Enter-key audit (global rule 6), for the phases that own these screens:** `hooks/useEnterSubmit.js`
  already excludes `TEXTAREA` and `BUTTON` and handles IME composition, and it's wired into the
  register wizard and `CreateFlareForm`. Login, register step 2 and forgot-password use real
  `<form onSubmit>`. **Gap:** register step 4 (OTP) has no Enter handling — `InputOTP`'s `onComplete`
  covers the normal path, but Enter on a partially-typed code does nothing. Address in Phase 4.
- The onboarding modal still blurs the app — that's Phase 2, deliberately untouched here.

**Handoff → Phase 2**

`AppShell` is now the single place authenticated chrome is composed, and `OnboardingWalkthrough` is
mounted inside it (so it also appears on info pages viewed while signed in — fine, it's global
chrome, and it only shows once per user). Phase 2 should:

1. Rework `OnboardingWalkthrough` in place into the contextual corner panel with the consent-first
   slide, outside-click-to-close, and no full-screen blur.
2. Add `app/(app)/notifications/page.js` reusing `NotificationsPanel`'s list, and convert the sidebar
   item + feed bell to plain links, deleting the `sessionStorage`/window-event handoff in
   `AppSidebar.js` and `flares/page.js`.
3. Fix self-notification inside `lib/NotificationProvider.js`'s `notifyNewFlare`, and drop the
   `notifyNewFlare` call in `handleFlareCreated`.

**Next phase to implement: Phase 2 — Onboarding popover + notifications page + self-notify fix.**
*(Superseded — Phase 2 is complete, see below.)*

---

### Phase 2 — Onboarding popover + notifications page + self-notify fix — ✅ COMPLETE

**What it accomplished**

1. *Onboarding is no longer a modal.* `OnboardingWalkthrough` is now a compact panel pinned to the
   bottom edge (bottom-right, `21rem` wide, from `sm` up; full-width inset on mobile). No backdrop,
   no blur, nothing dimmed — the app stays visible **and fully interactive** behind it.
2. *It asks first.* Stage `ask` opens with "Want a quick guide?" and two clear actions —
   **Show me** (primary) and **No thanks**. Only on Yes does the `tour` stage run the slides, which
   were cut from 5 to 4 and tightened to fit the smaller panel.
3. *Every exit closes it for good.* Clicking/tapping outside the panel, Escape, the X, Skip, and
   "Let's go" on the last slide all write the existing per-user `iflare_onboarding_seen:<id>` key.
   Still new-users-only, still per-account.
4. *Notifications are a real page.* New `app/(app)/notifications/page.js` in the `(app)` group, with
   the same session guard and loading spinner as `/settings`. `NotificationsPanel` was converted in
   place from a fixed-overlay modal to a plain in-page card — same list, same permission nudges, same
   provider API (`markAsRead` / `markAllAsRead` / `clearAll`).
5. *The handoff is gone.* The sidebar's Notifications item is a plain `Link` to `/notifications` (the
   unread badge still works), and the feed's bell is now an `<a>` to the same place. The
   `iflare_open_notifications` sessionStorage key and the `iflare:open-notifications` window event
   are deleted, along with `NavItem`'s `action`/`onAction` plumbing.
6. *No self-notification.* `notifyNewFlare` bails when the flare's host is the signed-in user, and
   the offending call in `handleFlareCreated` is removed.

**Files changed**

| File | Change |
| ---- | ------ |
| `components/OnboardingWalkthrough.js` | Reworked in place: bottom-anchored panel, consent-first `ask` stage, outside-click close |
| `app/(app)/notifications/page.js` | **New** — notifications as a normal authenticated page |
| `components/NotificationsPanel.js` | Modal chrome removed; now an in-page card, no `open`/`onClose` props |
| `components/AppSidebar.js` | Notifications is a `Link`; `action`/`onAction`/`useRouter` plumbing deleted |
| `app/(app)/flares/page.js` | Bell → `Link`; panel, `showNotifications` state, sessionStorage/event effect and `notifyNewFlare` call removed |
| `lib/NotificationProvider.js` | `isOwnFlare()` helper + guard at the top of `notifyNewFlare` |

**Implementation decisions**

- *Outside-click via a document listener, not an invisible overlay.* An overlay would satisfy
  "clicking outside closes" but would also swallow clicks meant for the app, contradicting "the
  underlying application remains clearly visible" in spirit. A `mousedown`/`touchstart` listener that
  checks `panelRef.contains(target)` closes on outside clicks while leaving the app clickable.
- *Guard in the provider, not the call site.* `isOwnFlare` reads the session from `localStorage` at
  call time (where every page already keeps it) and compares against `flare.host.id` — the shape the
  API writes (`app/api/[[...path]]/route.js`, `host: { id, name }`). Any future caller, including a
  server-side fan-out, inherits the rule. If the session can't be read, it errs toward notifying.
- *`NotificationsPanel` converted rather than duplicated.* It was the only consumer of the modal
  shape, so the component became the page body instead of a second component being written.
- *Slides trimmed to 4.* The welcome slide's content moved into the `ask` prompt, which would
  otherwise repeat it.

**Tests / checks performed**

- `next build` — clean, 19 routes (up from 18: `/notifications` at 4.08 kB / 91.2 kB First Load JS).
- Ran `next start` and verified over HTTP:
  - `/flares` has exactly two `href="/notifications"` (sidebar item + feed bell), the bell renders as
    `<a aria-label="Notifications" …>`, and **zero** `aria-modal="true"` nodes remain on the page.
  - `/notifications` serves and renders the guard's spinner in SSR, matching `/settings`.
- `grep` confirmed no references to `iflare_open_notifications`, `iflare:open-notifications`, or the
  old `NotificationsPanel` modal props survive anywhere.
- Source check: no `backdrop-blur` or `bg-black/70` left in `OnboardingWalkthrough.js`.

Not verified by machine: the panel's outside-click/Escape behaviour and the mobile layout need a
browser pass, as does the first-run flow (clear `iflare_onboarding_seen:<id>` in localStorage to
replay it).

**Known issues / notes for later**

- **The app currently generates no "new flare" notifications at all.** This is the honest state after
  the fix, not a regression introduced by it: there was never any fan-out to other users — the single
  call site was the creator notifying *themselves*, which is exactly the bug that was reported. The
  provider, the badge, and the page all work; they have nothing to display until a real fan-out
  exists (server-side push, or the feed poll diffing new flares against the user's interests). Worth
  scheduling as its own piece of work — it is not part of Phases 3-6.
- `lib/notifications.js:92` exports a second, unused `notifyNewFlare` that predates the provider and
  has no self-flare guard. Dead code today; delete it in Phase 6 rather than leaving a trap.
- The onboarding panel sits at `z-50`, the same layer as the mobile sidebar sheet. Opening the
  sidebar while the guide is up dismisses the guide (it counts as an outside tap) — acceptable, and
  consistent with the "click outside closes" rule.

**Handoff → Phase 3**

Nothing in Phase 2 touched interests, so Phase 3 starts from a clean base. It is the first phase with
a **backend change** — read §3 decision 3 (per-university custom interests) and §5 Phase 3 before
starting, and note that `ensureMigrated()` in `app/api/[[...path]]/route.js` is where the new index
belongs (it already creates the `messages` / `otps` / `password_resets` indexes and is idempotent per
server start).

**Next phase to implement: Phase 3 — Shared interest chip/selector + custom-interest persistence.**
*(Superseded — Phase 3 is complete, see below.)*

---

### Phase 3 — Shared interest chip/selector + custom-interest persistence — ✅ COMPLETE

**What it accomplished**

1. *One chip for every interest.* `components/InterestChip.js` renders built-in and custom interests
   identically — one neutral resting state, one orange selected state. It deliberately ignores
   `INTERESTS[].color`, the per-id palette that only ever matched the twelve built-ins and left a
   user's own interest grey next to a green "Sports & Fitness".
2. *One picker.* `components/InterestSelector.js` — selected chips with an X, a search input,
   suggestions below it, and an `Add "…"` affordance for a name the catalogue doesn't have. Enter
   picks an exact match or creates a custom interest, and `preventDefault` + `stopPropagation` mean
   it can never reach an ancestor `useEnterSubmit` handler or submit a surrounding `<form>`.
3. *Custom interests persist, scoped per university.* New `interests` collection
   (`{ id, name, emoji, emailDomain, createdBy, createdAt }`), unique on `{id, emailDomain}`, with
   both indexes created in `ensureMigrated()`. `GET /api/interests` returns the caller's campus
   extras; `POST /api/interests` slugifies, upserts, and stamps domain + creator.
4. *`users.interests[]` and `flares.interests[]` are unchanged* — still bare ids. A custom interest
   is a catalogue row, not a new storage shape.
5. *`lib/interests.js` gained the shared vocabulary*: `slugifyInterest`, `mergeInterests`,
   `resolveInterest`, `DEFAULT_INTEREST_EMOJI`, `INTEREST_NAME_MAX_LENGTH`, and `searchInterests`
   now takes a catalogue. The built-in list is untouched and remains the static base.

**Files changed**

| File | Change |
| ---- | ------ |
| `components/InterestChip.js` | **New** — the one chip; static / toggle / removable shapes |
| `components/InterestSelector.js` | **New** — search + suggestions + create + selected chips |
| `lib/useInterestCatalog.js` | **New** — fetches campus custom interests, module-level shared cache |
| `lib/interests.js` | Slugify/merge/resolve helpers; `searchInterests` accepts a catalogue |
| `app/api/[[...path]]/route.js` | `interests` indexes in `ensureMigrated`, `resolveUserDomain` helper, `GET`/`POST /interests` |

**Implementation decisions**

- *Slugification is shared, not duplicated.* `slugifyInterest` lives in `lib/interests.js` and is
  imported by both the client and `route.js` (which already imports `lib/universities.js`). Client
  and server agreeing on the id for a given name is what makes the upsert idempotent — "Board Games",
  "board games" and "  board   games " all land on `board-games`.
- *`$setOnInsert`, so the first creator's wording sticks.* A later writer with different casing
  re-uses the row instead of renaming an interest under everyone who already selected it.
- *Built-in ids always win.* `POST /interests` with a name that slugifies to a built-in returns the
  built-in and writes nothing, so no campus can shadow a shared id that is already persisted on
  existing user and flare documents.
- *The catalogue fetch is cached at module scope with a subscriber set,* not re-fetched per mount:
  Phase 6 will have several components rendering interests on the same screen, and the list is small,
  campus-wide and near-static. It is keyed by user id so a logout → login in the same tab can't
  inherit the previous campus's interests, and a create pushes into the same cache so every mounted
  consumer sees the new chip without a refetch. A failed fetch degrades to the built-in list.
- *`resolveInterest` falls back to a de-slugified name* rather than showing a raw `board-games`, since
  a chip can be asked to render an id from another campus or before the fetch resolves.
- *`suggestionLimit` defaults to 24, not 12.* Caught in browser testing: at 12 the built-ins consumed
  the entire list and every custom interest was truncated away, making them undiscoverable to anyone
  who didn't already know the name. Phase 5's popover can pass a smaller limit.
- *`onRemove` renders a `<span>` wrapper, not a `<button>`* — the X is a real button and nesting
  buttons is invalid HTML.

**Tests / checks performed**

- `next build` — clean, 19 routes, no new warnings.
- API, against a scratch DB with three seeded users (two at `iitkgp.ac.in`, one at `iitb.ac.in`):
  empty catalogue; missing `userId` → 400; unknown user → 404; create `Board Games`; the same slug
  from a second user with different casing/spacing re-uses the row; a built-in name returns the
  built-in and writes nothing; too short → 400; punctuation-only → 400; over 40 chars → 400; bad
  emoji → 400. Cross-university scoping confirmed: both campuses hold their own `board-games` and
  each `GET` returns only its own. `E11000` confirmed the unique index actually rejects a duplicate.
- **Browser (Playwright, 17 assertions, all passing)** against a temporary harness page that mounted
  the selector inside both a `<form onSubmit>` and a `useEnterSubmit` wrapper: custom interest
  suggested alongside built-ins; search filters; click-to-select clears the query; selected chip has
  an X; **built-in and custom selected chips render byte-identical class strings**; Enter creates and
  selects a custom interest **without submitting the form or advancing the step**; Enter on an exact
  existing name picks it instead of duplicating; the `Add` affordance appears only for genuinely new
  names; the min hint counts correctly; X and backspace both remove; created interests survive a
  reload; no page errors. The harness page and the scratch DB were deleted afterwards.

**Known issues / notes for later**

- **The selector is not yet wired into any page** — that's Phases 4 (register), 5 (create-flare) and
  6 (the audit sweep), by design. Until then the old inline 12-chip grids are still what users see.
- `INTERESTS[].color` / `.tag` are still on the built-in objects because the un-migrated pages read
  them. Delete both fields in Phase 6 once nothing references them.
- Custom interests are created but never garbage-collected: a typo'd interest that nobody selects
  stays in the campus's suggestion list forever. Worth a moderation or usage-count pass later; not
  part of Phases 4-6.
- `POST /interests` takes `userId` from the request body like the rest of the API, so it inherits the
  project's existing trust model — anyone can create an interest under another user's campus. No
  worse than the surrounding endpoints, and it's covered by the session-token item in `CLAUDE.md`.
- There is no rate limit on interest creation, consistent with the rest of the API.

**Handoff → Phase 4**

Phase 4 (registration → 4 steps) should drop `InterestSelector` into the merged Personalise step with
`userId` from the freshly-issued session, `min={3}`, and the bio field beside it — the account exists
by then, so custom-interest creation works. Remember the two backend items Phase 4 owns: relaxing
`/auth/signup/start` so `interests` is optional (§3 decision 1), and the missing Enter handling on the
OTP step flagged in Phase 1's notes.

**Next phase to implement: Phase 4 — Registration → 4 steps.**
*(Superseded — Phase 4 is complete, see below.)*

---

### Phase 4 — Registration → 4 steps — ✅ COMPLETE

**What it accomplished**

1. *Four steps, in the order the brief asked for.* `STEPS` is now
   `['University', 'Account', 'Verify', 'Personalise']`. The old always-visible 12-chip interests
   step between Account and OTP is gone; step 2's `Continue` validates locally and goes straight to
   requesting the code, so the stepper reads 1→2→3→4 with no dead middle.
2. *`/auth/signup/start` accepts a request with no interests.* The `!interests` completeness check and
   the `length < 3` gate are replaced by a shape check — supplied interests must be an array, absent
   ones default to `[]` in `pendingSignup`. `/auth/signup/verify` already read `ps.interests || []`,
   so account creation needed no change. OTP mechanics, rate limits and the rollback-on-send-failure
   path are all untouched.
3. *Step 4 merges interests and bio.* `InterestSelector` (Phase 3) is dropped in with
   `userId={savedSession.user.id}` and `min={3}`, above an optional bio textarea. Because the account
   exists by this point, a student can create a custom interest for their campus right there during
   signup — the reason interests moved after the OTP in the first place.
4. *One primary action, no Skip.* `Continue` is disabled until 3 interests are picked and saves
   `{ interests, bio }` in a single `PUT /user/settings`, sending `''` for an untouched bio. Back is
   hidden on step 4 rather than doing something surprising: the account already exists, so there is
   nothing to return to, and interests are required to reach the feed.
5. *The OTP step answers the Enter key.* `useEnterSubmit` is wired to step 3 with
   `{ disabled: isLoading }`, closing the gap Phase 1 flagged — Enter on a partially-typed code now
   reports "Enter the 6-digit code from your email" instead of doing nothing. A complete code still
   submits via `onComplete`.

**Files changed**

| File | Change |
| ---- | ------ |
| `app/api/[[...path]]/route.js` | `/auth/signup/start`: interests optional (shape-checked only), `pendingSignup.interests` defaults to `[]` |
| `app/register/page.js` | 5 steps → 4; interests moved into the final step via `InterestSelector`; bio saved together with interests; Skip removed; Back hidden on step 4; Enter wired to the OTP step |

**Implementation decisions**

- *Shape check, not a silent accept.* `/start` still rejects a non-array `interests` (400 "Interests
  must be a list") rather than ignoring it. Relaxing "at least 3" is deliberate; letting a malformed
  payload through quietly is not — and the min-3 rule still exists, enforced by
  `PUT /user/settings`, which is now the only place signup writes interests.
- *Step 2 submits the signup, so it owns the loading state.* Its button was a plain `Continue`; it
  now shows the `Sending code...` spinner and disables while `/start` is in flight, because that
  button is what triggers the network call after the interests step was removed.
- *Back is hidden on step 4, not repurposed.* Previously it doubled as Skip (`aria-label` flipped to
  "Skip"), which no longer has a meaning now that interests are required. A `canGoBack` flag renders
  the same-size spacer the right-hand side already uses, so the header doesn't shift.
- *The cached session is updated with both fields.* `localStorage.iflare_user` gets the interests and
  the bio after the save, so `/flares` matches the feed on the right interests without waiting for a
  `/user/me` refetch.
- *`INTERESTS` is no longer imported by the register page* — the inline chip grid that used
  `interest.color` is gone, which is one of the three call sites Phase 6 needs cleared before those
  fields can be deleted.

**Tests / checks performed**

- `next build` — clean, 19 routes, no new warnings. `/register` 15.8 kB / 119 kB First Load JS.
- API, against a scratch DB (`iflare_phase4_scratch`, dropped afterwards):
  - `POST /auth/signup/start` with **no** `interests` → 200, and the stored `pendingSignup` is
    `{..., interests: []}`.
  - `interests: "sports"` → 400 "Interests must be a list"; missing `name` → 400 "All fields are
    required" (the other completeness checks still bite).
  - `POST /auth/signup/verify` → 200, user created with `interests: []`, `bio: ''`, correct
    `university`/`emailDomain`.
  - `PUT /user/settings` with 3 interests (2 built-in + 1 custom) + bio → 200 and both persisted;
    `bio: ""` accepted; 1 interest → 400 "Please select at least 3 interests".
- **Browser (Playwright, 26 assertions, all passing)** driving the real wizard at 390×844 through two
  complete signups: stepper reads "Step 1..4 of 4" with no Interests label; Account → OTP directly;
  Enter on a partial OTP surfaces the error and stays on the step; step 4 has no Skip and no Back;
  Continue disabled at 0 and 2 interests, enabled at 3; Enter in the selector creates
  "Ultimate Frisbee" **without submitting or advancing the step**; landing on `/flares` with
  interests + bio correct in both `localStorage` and `GET /user/me`; a second account on the same
  campus is offered that custom interest; an empty bio still completes signup; no page errors.
- To run the OTP path locally the mailer was temporarily stubbed behind an env flag; the stub was
  removed and `next build` re-run clean afterwards — `grep IFLARE_TEST_MAIL_STUB` returns nothing.
  The scratch DB was dropped; `iflare_dev` was never touched.

**Known issues / notes for later**

- **A user who abandons step 4 has an account with no interests.** The account is created at OTP
  verification and the session is already in `localStorage`, so closing the tab there leaves a
  usable login whose feed matches nothing. There is no route guard (by design — see `CLAUDE.md`), so
  they'd land on an empty `/flares` and have to add interests from `/profile`. Worth a "finish your
  profile" nudge on the feed later; out of scope for Phases 5-6.
- The legacy `POST /auth/register` (410 Gone) is unaffected — it isn't part of the wizard.
- `selectedInterests` is still declared near the top of the page with the other step state even
  though only step 4 reads it now; left as-is to keep the diff to the flow itself.
- Step 4's heading changed from "Add a short bio" to "Finish your profile" since the step is no
  longer bio-only. The bio textarea keeps the 300-char counter and its no-Enter-to-submit comment.

**Handoff → Phase 5**

Phase 5 (create-flare steps) is frontend-only and starts from a clean base — nothing in Phase 4
touched `CreateFlareForm`. `InterestSelector` is now proven inside a `useEnterSubmit` wrapper *and*
in real use, so Phase 5 can put it in the step-1 `Popover` directly; pass a smaller
`suggestionLimit` there, as Phase 3 anticipated. Note that Phase 6 still owns deleting
`INTERESTS[].color`/`.tag` — after Phase 4 the register page no longer reads them, leaving the
create-flare form and the audit-sweep pages as the remaining consumers.

**Next phase to implement: Phase 5 — Create-flare step 1 compaction + step 2 time/date.**
*(Superseded — Phase 5 is complete, see below.)*

---

### Phase 5 — Create-flare step 1 compaction + step 2 time/date — ✅ COMPLETE

**What it accomplished**

1. *Step 1 fits one screen.* The always-visible grid of every interest is gone; interests are now
   picked in a `Popover` holding the Phase 3 `InterestSelector`. The "Need an idea?" block is a
   `Collapsible`, shut by default and closing again once an idea fills the title. Title input, the
   participant buttons and the step's vertical rhythm were tightened a notch. At 390×844 the
   `Continue` button's bottom edge sits at 838px — on screen, no scrolling.
2. *Selected interests stay visible after the popover closes.* The trigger reads "Choose interests" /
   "N interests selected", and the chosen chips render under it as removable `InterestChip`s, so the
   picker being hidden never hides the choice. Multiple interests still allowed.
3. *Custom interests work here too.* The selector is passed `userId={currentUser?.id}`, so a student
   can create a campus interest while creating a flare — the same component and the same
   `POST /api/interests` the register wizard uses. The data model is untouched: `flares.interests[]`
   still stores bare ids.
4. *Step 2 asks for the time first, then the date.* Two labelled cards — **Time** (`Clock`) above
   **Date** (`CalendarDays`) — replace the side-by-side date+time row. Time gets "In 30 min / In 1 hr
   / In 2 hrs" shortcuts that set both fields, rounded up to the next 5 minutes; Date gets
   Today/Tomorrow chips beside the native picker. `StartTimePreview` and the `POST /api/flares` body
   are byte-for-byte unchanged.
5. *Fixed a real timezone bug while reordering.* `todayISO()` derived "today" from `toISOString()`,
   i.e. UTC — for an IST user between 00:00 and 05:30 the date input's `min` was yesterday and the
   quick offsets would have produced the wrong day. Replaced with local-timezone
   `toDateValue`/`toTimeValue`/`todayValue`/`dateValueIn` helpers.

**Files changed**

| File | Change |
| ---- | ------ |
| `components/CreateFlareForm.js` | Ideas collapsible; interests popover + visible chips; step 2 reordered to Time → Date with quick offsets and day chips; local-timezone date helpers |
| `components/InterestSelector.js` | New `showSelected` prop (default `true`) so a host can render the selected chips itself |

**Implementation decisions**

- *`showSelected={false}` in the popover rather than duplicated chip rows.* The chips have to live in
  the form — they must survive the popover closing — so having the selector also render them would
  show the same interests twice while the popover is open. One prop, default unchanged, so the
  register wizard is unaffected.
- *The popover trigger is a `<button>`, which `useEnterSubmit` already skips*, so Enter on it opens
  the picker instead of jumping to step 2. Inside the popover, `InterestSelector`'s existing
  `preventDefault` + `stopPropagation` matters more than usual here: Radix portals the content but
  React events still bubble through the component tree, so without it Enter-to-create would have
  advanced the step.
- *Quick offsets set the date as well as the time.* "In 2 hrs" at 23:30 has to mean tomorrow;
  setting only the time would have silently created a flare that already passed.
- *Relative shortcuts are actions, not a mode.* They write into the same two fields and carry no
  `aria-pressed` — the truth stays in the time/date inputs, and the preview line under them restates
  it. The Today/Tomorrow chips do carry `aria-pressed`, because those are a selected value.
- *`suggestionLimit={12}` in the popover*, as Phase 3 anticipated — the popover is short, and search
  narrows the list before it matters.

**Tests / checks performed**

- `next build` — clean, 19 routes, no new warnings. `/flares` 14.9 kB / 143 kB First Load JS.
- **Browser (Playwright, 32 assertions, all passing)** at 390×844 against `next start` and a scratch
  DB (`iflare_phase5_scratch`, dropped afterwards; `iflare_dev` never touched), driving the real
  form end to end: ideas collapsed by default and collapsing again after a pick; no interest grid on
  the step; `Continue` above the fold with only the shell's ~40px padding below it; popover opens the
  shared selector; a picked interest appears as a chip in the form; Enter creates "Catan Night"
  **without advancing the step**; Escape closes the popover and the chips remain; the trigger count
  reads singular/plural correctly; the X removes a chip; the custom interest is really persisted
  (`GET /api/interests`); step 2's time control precedes the date control in the DOM with labels
  reading Time → Date; "In 1 hr" sets both fields rounded to 5 minutes; `min` on the date input is
  the **local** today; Tomorrow/Today chips set and mark themselves pressed; and the created flare
  came back with `interests: ["catan-night"]`, the unchanged `{name, lat: null, lng: null}` location,
  an ISO `startTime` and `maxAttendees: 4`. No page errors.
- Fold measured across viewports (Continue bottom vs fold): 390×844 → 838 ✅, 412×915 → 838 ✅,
  1280×800 → 768 ✅, **360×640 → 890 ✗** (see below).

**Known issues / notes for later**

- **On a 640px-tall viewport step 1 still scrolls.** The step itself is ~700px and the page header
  plus the Join|Create switch take ~180px more, so a short/old phone can't fit it whatever the form
  does short of dropping a field. Every current-generation phone (844px+) fits. Not worth gutting the
  step for; revisit only if analytics show those devices.
- The popover is the only way to reach the picker, so interests are one tap further away than before.
  That is the trade the compaction buys; the visible chips and the count on the trigger are what keep
  the state legible without it open.
- `components/CreateFlareForm.js` no longer reads `INTERESTS[].color` — with the register page
  already migrated in Phase 4, only the Phase 6 audit-sweep pages (`FlareSearch`, `FlareCard`,
  `FlareDetailModal`, profile, activity) still use `.color`/`.tag` before those fields can go.
- Copy still says "Create iFlare" / "Failed to create iFlare" in this form. Deliberately left —
  the terminology pass is Phase 6's, and doing it here would have scattered it across two phases.

**Handoff → Phase 6**

Phase 6 is the last one: the audit sweep, the terminology pass and the docs. Concretely, from what
Phases 1-5 left behind:

1. Move `FlareSearch`, `FlareCard`, `FlareDetailModal`, `/profile` and `/activity` onto
   `InterestChip`, then delete `INTERESTS[].color` and `.tag` from `lib/interests.js` — nothing else
   reads them after that.
2. "iFlare" → "flare" for individual meetups in user-facing copy, including the flares page's
   Join/Create tabs and this form's submit button and error string.
3. Delete the dead `notifyNewFlare` in `lib/notifications.js:92` (flagged in Phase 2).
4. Document the university-specific-locations TODO in `lib/campusLocations.js` + `CLAUDE.md`, and add
   the `interests` collection and its two endpoints to `DEVELOPMENT.md`. `CLAUDE.md` also still
   describes registration as a 5-step wizard and lists `components/` without the Phase 1-5 additions.
