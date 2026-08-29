# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Project Purpose

**iFLARE** — *"Real connections. Right now."* — is a mobile-first web app that
lets **Indian college students** create and join spontaneous, interest-based
meetups ("**iFlares**": study buddies, gym partners, coffee runs, cycling
groups, game nights, etc.) with peers **from their own university only**.
University scoping is enforced by matching the email domain used at
registration (e.g. an IIT KGP student only sees IIT KGP flares).

For the full feature list see [`README.md`](./README.md).

## Technology Stack

| Layer            | Choice                                                          |
| ----------------- | ---------------------------------------------------------------- |
| Framework         | Next.js 14 (App Router)                                          |
| Language           | JavaScript (JSX) — no TypeScript                                 |
| Styling            | Tailwind CSS + shadcn/ui (Radix primitives)                      |
| Icons              | lucide-react (the `Radar` icon is the brand mark)                |
| Forms/validation   | react-hook-form + zod                                            |
| Database           | MongoDB via the `mongodb` driver (local in preview, managed in production) |
| Auth               | Custom — SHA-256 password hash + base64 JSON session token (see Security section — **not production-grade**) |
| Email (opt-in)     | Resend (`resend` npm package) — mostly disabled in current flows |
| Package manager    | yarn                                                              |
| Process manager    | `supervisor` — runs Next.js on `0.0.0.0:3000`                    |

## Project Structure

```
/app                                    # repo root (Next.js project root)
├── app/                                # Next.js App Router
│   ├── api/[[...path]]/route.js        # ⭐ Monolithic API — every backend endpoint lives here
│   ├── page.js                         # Landing page (/)
│   ├── login/page.js                   # /login
│   ├── register/page.js                # /register
│   ├── verify/page.js                  # /verify — email verification landing (legacy flow)
│   ├── forgot-password/page.js         # /forgot-password
│   ├── flares/page.js                  # /flares — main dashboard (largest page in the app)
│   ├── activity/page.js                # /activity — flares you created/joined
│   ├── profile/page.js                 # /profile — interests + university card
│   ├── layout.js, globals.css, icon.svg
├── components/
│   ├── OnboardingWalkthrough.js        # 5-slide first-time-user modal
│   ├── ClientProviders.js              # Wraps client-side context providers (e.g. notifications)
│   └── ui/                             # shadcn/ui primitives (generated, mostly untouched)
├── lib/
│   ├── universities.js                 # ⭐ Indian university domain whitelist/blocklist + resolver
│   ├── NotificationProvider.js         # In-app notifications context
│   └── notifications.js                # Notification helper functions
├── memory/
│   └── test_credentials.md             # Test accounts for manual QA
├── hooks/                              # Custom React hooks
├── DEVELOPMENT.md                      # Full DB schema + API reference + hardening checklist
├── README.md                           # Project overview
├── test_result.md                      # Test run notes/log
└── .env                                # Env vars — never commit real values
```

## How to Run the Project

This is intended to run inside the Emergent platform workspace, managed by
`supervisor` — you normally **do not** run `next dev` yourself:

```bash
sudo supervisorctl status              # see what's running
sudo supervisorctl restart nextjs      # restart after editing .env or deps
tail -n 200 /var/log/supervisor/nextjs.out.log   # tail logs
```

Frontend hot-reload picks up file edits under `app/` and `components/`
automatically — no restart needed for normal code changes.

`package.json` also defines standalone scripts (`yarn dev`, `yarn build`,
`yarn start`) if you need to run Next.js directly outside supervisor.

**Env vars** (`/app/.env`): `MONGO_URL`, `DB_NAME` (`iflare`),
`NEXT_PUBLIC_BASE_URL`, `RESEND_API_KEY`, `CORS_ORIGINS`. Never hand-edit
`MONGO_URL` or `NEXT_PUBLIC_BASE_URL` — the Emergent platform manages and
wires these to the correct backing services per environment.

## Important Files and What They Do

| File | Purpose |
| ---- | ------- |
| `app/api/[[...path]]/route.js` | Every backend endpoint: auth, user, flares, chat. ~1370 lines, single `handleRoute` dispatcher. |
| `lib/universities.js` | The whitelist of Indian university email domains + `resolveUniversity()` / `getDomainFromEmail()` — the core of the product's access-control model. |
| `app/flares/page.js` | Main dashboard: feed, create/join flow. Largest frontend file (~1100 lines); README flags it as a future refactor target. |
| `lib/NotificationProvider.js` / `lib/notifications.js` | In-app bell/unread-badge notification system. |
| `components/OnboardingWalkthrough.js` | First-time-user 5-slide intro modal. |
| `components/ClientProviders.js` | Root wrapper composing client-side context providers. |
| `DEVELOPMENT.md` | Authoritative deep-dive: full DB schema, full API endpoint reference, DB backup/restore, security hardening checklist. Read this for anything this file only summarizes. |
| `memory/test_credentials.md` | Suggested test accounts (same-university pair + cross-university pair) for manual QA. |

## Frontend / UI Architecture

- Next.js **App Router**: each route is a folder under `app/` with its own
  `page.js`; routing is file-based, no separate router config.
- Pages are client-heavy (fetch data from the monolithic API, manage local
  state) rather than using server components/server actions.
- Shared UI comes from `components/ui/` — shadcn/ui components generated on
  top of Radix primitives (`components.json` configures the shadcn setup).
- Styling is Tailwind CSS throughout (`tailwind.config.js`), with
  `tailwind-merge`/`class-variance-authority` for variant composition.
- Toasts via `sonner`; forms via `react-hook-form` + `zod` resolvers.
- Cross-cutting concerns (notifications, etc.) are wired through
  `components/ClientProviders.js` so pages can consume context via hooks.
- Icon system is `lucide-react`; the `Radar` icon is the app's brand mark.

## Backend / API Architecture

- **Single catch-all route**: `app/api/[[...path]]/route.js` handles all
  HTTP verbs through one `handleRoute(request, { params })` function. There
  is no separate router library — dispatch is a long chain of
  `if (route === '/x' && method === 'Y') { ... }` (with `route.match(/regex/)`
  for dynamic segments like `/flares/:id/messages`).
- **Mongo connection** is a lazy singleton (`connectToMongo()`), reused
  across requests within the same server process.
- **`ensureMigrated(db)`** runs once per server start (idempotent): backfills
  `emailDomain`/`hostEmailDomain` on legacy documents and creates indexes
  (`messages`, `otps`, `password_resets` — the latter two are TTL-indexed
  for auto-expiry).
- **CORS** is handled manually — every response is wrapped in `handleCORS()`,
  which sets `Access-Control-Allow-*` headers (origin defaults to `*` unless
  `CORS_ORIGINS` is set).
- **Access-control helpers** are written per-feature, e.g.
  `assertFlareChatAccess(db, flareId, userId)` — only the flare's host or an
  attendee may read/write its chat.
- Route groups actually present in the code:
  - **Auth**: `/auth/register` (legacy), `/auth/signup/{start,verify,resend}`
    (current OTP flow), `/auth/forgot-password/{start,verify}`,
    `/auth/verify`, `/auth/login`, `/auth/resend-verification`.
  - **User**: `/user/me`, `/user/interests`, `/user/settings`,
    `/user/:id/flares`, `/user/:id/activity`.
  - **Flares**: `POST /flares` (create), `GET /flares` (university-scoped
    feed), `POST /flares/:id/join`.
  - **Chat**: `GET/POST /flares/:id/messages`.
- Full endpoint-by-endpoint reference: [`DEVELOPMENT.md § 7`](./DEVELOPMENT.md#7-api-reference).

## Database Structure

MongoDB database `iflare`. Collections: `users`, `flares`, `messages`, plus
`otps` and `password_resets` (short-lived, TTL-indexed for the OTP-based
signup/reset flows). **All app-level IDs are UUIDs (`uuid` v4), never Mongo
`ObjectId`** — kept out of API responses because `ObjectId` isn't directly
JSON-serializable.

- `users`: `id`, `name`, `email`, `password` (SHA-256 hex), `interests[]`,
  `emailDomain` (auto-set, drives university scoping), `university`,
  `isVerified`, `createdAt`/`updatedAt`, plus legacy/optional fields
  (`verificationToken`, `verificationTokenExpiry`, `visibilityMode`).
- `flares`: `id`, `title`, `description`, `interests[]`, `location`
  (free-form `{name, lat, lng}` — no Google Maps yet), `host`, `attendees[]`,
  `maxAttendees`, `startTime`, `hostEmailDomain` (drives university-scoped
  visibility), `createdAt`/`updatedAt`.
- `messages`: per-flare chat messages. Indexed on `{flareId, createdAt}` and
  unique on `{id}`.
- `otps` / `password_resets`: unique per `email`, TTL-expired via
  `expiresAt` (`expireAfterSeconds: 0`).
- No indexes on `users.email`/`users.id` are created yet even though they're
  the primary lookup keys — `DEVELOPMENT.md` flags this as a to-do.

Full field-by-field schema: [`DEVELOPMENT.md § 5`](./DEVELOPMENT.md#5-database-schema).

## Authentication Flow

1. **Register/signup** — email is validated against
   `lib/universities.js` (`resolveUniversity`): must be on the explicit
   Indian-university whitelist, a subdomain of one, or end in `.ac.in`/
   `.edu.in`; explicitly-blocked personal-email domains (gmail, yahoo,
   outlook, icloud, etc.) are rejected. Two parallel flows exist in the
   code: the newer OTP-based `/auth/signup/start` → `/auth/signup/verify`,
   and a legacy `/auth/register` + token-link `/auth/verify`.
2. Password is hashed with **unsalted SHA-256** (`hashPassword`) and the
   user document is stored with `emailDomain` stamped from the email.
3. **Login** (`POST /auth/login`) re-validates the domain (403 if blocked,
   in case a legacy account slipped through), looks up the user by
   lowercased email, and compares the SHA-256 hash.
4. On success, a **session token** is issued by `generateSessionToken`:
   `base64(JSON.stringify({ userId, timestamp }))` — plain base64, **no
   signature, no expiry**.
5. The client stores this token and sends it as `Authorization: Bearer
   <token>`. On protected routes (e.g. `GET /user/me`) the server just
   base64-decodes the payload, reads `userId`, and looks the user up fresh
   from Mongo — the token is a lookup key, not a cryptographically verified
   credential.
6. `POST /flares/:id/join` and chat routes take `userId` from the request
   body/lookup rather than deriving it from a verified session, matching the
   same trust model.

## Important Security Considerations

These are real, current gaps in the code — not hypothetical:

- **Unsigned session tokens**: `generateSessionToken` produces a plain
  base64 JSON blob with no HMAC/JWT signature. Anyone can construct a valid
  `Bearer` token for **any** `userId` by base64-encoding
  `{"userId": "<victim-id>"}` — there is no way for the server to detect a
  forged token. This is the single highest-priority item to fix before any
  real launch (replace with signed JWT via `jose`, or server-side sessions).
- **Unsalted SHA-256 passwords**: no per-user salt, no adaptive cost —
  vulnerable to rainbow-table/offline brute force if the DB leaks. Replace
  with bcrypt or argon2.
- **Verified gap — cross-university join is not enforced**:
  `POST /flares/:id/join` (`app/api/[[...path]]/route.js` around line 1212)
  performs no domain/university check at all. Any authenticated user can
  join any flare by ID regardless of university, even though the product's
  entire premise is university-scoped visibility. The feed endpoint
  (`GET /flares`) filters by domain, but the join endpoint doesn't
  re-verify — so this is enforceable only by not knowing another
  university's flare IDs, which is not real access control.
- **CORS defaults to `*`** unless `CORS_ORIGINS` is explicitly set.
- **No rate-limiting** on `/api/auth/*` or `POST /api/flares` — brute force
  and spam are both currently unmitigated.
- **Email verification is effectively disabled** (`isVerified` is set true
  automatically in the active signup path), so there's no real proof a
  registrant controls the university email they used.
- `.env` is gitignored and must never contain committed real secrets;
  `MONGO_URL`/`NEXT_PUBLIC_BASE_URL` are platform-managed — don't hand-edit.

Full checklist: [`DEVELOPMENT.md § 8`](./DEVELOPMENT.md#8-security-notes-for-future-hardening)
and [`README.md § Security Notes`](./README.md#-security-notes).

## Coding Conventions Observed

- **Plain JavaScript/JSX, no TypeScript.** 2-space indentation, single
  quotes, generally no trailing semicolons in `route.js`/`universities.js`
  — match this when editing those files.
- **API handlers** follow a consistent pattern: each route branch validates
  its own input and does an early `return handleCORS(NextResponse.json(...,
  { status }))` on failure — there's no shared middleware/validation layer,
  so new endpoints should follow the same inline-validation style rather
  than introducing a framework.
- **Dynamic route segments** are matched with regex
  (`route.match(/^\/flares\/[^/]+\/messages$/)`) rather than a router
  library — keep new dynamic routes consistent with this.
- **Comments explain *why*, not just *what*** (e.g. the migration backfill
  rationale, the chat-access-rule comment) — this codebase leans on inline
  rationale comments for non-obvious decisions; preserve that density when
  touching `route.js`.
- Several places already carry explicit "simple for now, harden later"
  comments (e.g. above `hashPassword`) — these are known, intentional MVP
  shortcuts, not oversights; don't "fix" them silently, but do flag them
  when relevant (see Security section above).
- camelCase for functions/variables; UUIDs (not Mongo `ObjectId`) as the
  app-level identifier convention everywhere.

## Further Reading

- [`README.md`](./README.md) — feature overview, roadmap, deploy flow.
- [`DEVELOPMENT.md`](./DEVELOPMENT.md) — full DB schema, full API reference,
  DB backup/restore workflow, complete security hardening checklist.
- [`memory/test_credentials.md`](./memory/test_credentials.md) — test
  accounts for manual QA.
