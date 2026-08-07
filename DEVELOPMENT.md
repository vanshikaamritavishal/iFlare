# iFLARE — Developer Documentation

> **Tagline:** *Real connections. Right now.*
> A mobile-first web app that lets Indian college students spark spontaneous,
> interest-based meetups (called **iFlares**) with peers from **their own
> university only**.

---

## 1. Tech Stack

| Layer            | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Framework        | **Next.js 14** (App Router)                         |
| Language         | JavaScript (JSX)                                    |
| Styling          | Tailwind CSS + shadcn/ui                            |
| Icons            | lucide-react (`Radar` icon is the brand mark)       |
| Database         | **MongoDB** (local, inside container)               |
| Auth             | Custom (email + SHA-256 password + base64 token)    |
| Email (disabled) | Resend (`resend` npm package, key present in `.env`)|
| Process manager  | `supervisor` — nextjs runs on `0.0.0.0:3000`        |

Hot reload is enabled: editing files under `/app/app` or `/app/components`
takes effect without a restart.

---

## 2. Project Layout

```
/app
├── app/
│   ├── api/[[...path]]/route.js   # ⭐ Monolithic API — all backend endpoints live here
│   ├── page.js                    # Landing page (/)
│   ├── login/page.js              # /login
│   ├── register/page.js           # /register
│   ├── flares/page.js             # /flares  ← main dashboard
│   ├── activity/page.js           # /activity
│   ├── profile/page.js            # /profile
│   ├── verify/page.js             # /verify (email verify page — currently unused)
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── ClientProviders.js         # Wraps client-side context providers
│   ├── OnboardingWalkthrough.js   # 5-slide first-time user modal
│   └── ui/…                       # shadcn/ui components
├── lib/
│   ├── universities.js            # ⭐ Whitelist of Indian university email domains
│   ├── NotificationProvider.js    # In-app notifications context
│   └── notifications.js           # Notification helper functions
├── memory/
│   └── test_credentials.md        # Test accounts (for QA / test agent)
├── .env                           # Environment variables (DO NOT commit real keys)
└── package.json
```

---

## 3. Environment Variables (`/app/.env`)

| Variable              | Purpose                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `MONGO_URL`           | MongoDB connection string. **In preview:** `mongodb://localhost:27017`      |
| `DB_NAME`             | Database name. Currently `iflare`                                            |
| `NEXT_PUBLIC_BASE_URL`| Public base URL, e.g. `https://iflare-preview.preview.emergentagent.com`    |
| `RESEND_API_KEY`      | Resend API key for email verification (currently unused in the flow)        |
| `CORS_ORIGINS`        | Optional. Overrides the `Access-Control-Allow-Origin` header (default `*`)  |

> ⚠️ **Never modify `MONGO_URL` or `NEXT_PUBLIC_BASE_URL`** — these are
> managed by the Emergent platform and are wired to the correct backing
> services (preview DB in preview, production DB after deploy).

---

## 4. Data Storage — Where does the DB live?

### 4.1 Preview environment (this workspace)

- MongoDB runs **inside the same container** as the Next.js app.
- Connection string: `mongodb://localhost:27017` → database `iflare`.
- Data lives on the container's **persistent disk**.
- **Survives:**
  - ✅ Code edits & Next.js hot reloads
  - ✅ `sudo supervisorctl restart nextjs` / `restart all`
  - ✅ Container sleep / resume
  - ✅ Pushing to GitHub (GitHub only stores code, not DB data)
- **Can be lost if:**
  - The container is fully reset / rebuilt (rare, but not backed up automatically)
  - You explicitly drop the DB (`db.dropDatabase()`)

### 4.2 Production (after deploy)

- Deployment provisions a **separate, isolated production MongoDB instance**.
- Preview DB and production DB share **no data**.
- Production data is **persistent across code deploys** — pushing new code
  or redeploying does **NOT** wipe user accounts, flares, etc.
- The environment variables in production are managed by Emergent and
  automatically point at the production MongoDB.

### 4.3 Backups

- No automatic backups are configured in preview.
- For anything critical, dump the DB manually (see § 6.3).

---

## 5. Database Schema

Database: `iflare`
Two collections: `users` and `flares`.
All IDs are **UUIDs** (never Mongo `ObjectId`, which is not JSON-serialisable).

### 5.1 `users` collection

```jsonc
{
  "_id": ObjectId("…"),               // Mongo-generated; never returned by API
  "id": "3f5a8c7b-…-uuid",            // App-level user ID (UUID)
  "name": "Alice Scaler",
  "email": "alice.test@sst.scaler.com",
  "password": "<sha256 hex>",         // SHA-256 (see § 8 note on hardening)
  "interests": ["sports", "music", "food"],
  "emailDomain": "sst.scaler.com",    // ⭐ Auto-set; used for university scoping
  "university": "Scaler School of Technology",
  "isVerified": true,                 // Auto true (email verification disabled)
  "createdAt": ISODate("…"),
  "updatedAt": ISODate("…"),

  // Optional / legacy:
  "verificationToken":       "…",     // Only if email verify is re-enabled
  "verificationTokenExpiry": ISODate("…"),
  "visibilityMode":          "community" // Legacy field; no longer used
}
```

**Indexes to consider adding** (none created yet):
`{ email: 1 } unique`, `{ id: 1 } unique`, `{ emailDomain: 1 }`.

### 5.2 `flares` collection

```jsonc
{
  "_id": ObjectId("…"),
  "id": "9e8c1a12-…-uuid",
  "title": "Looking for gym buddy",
  "description": "Chest & triceps day, intermediate level.",
  "interests": ["sports", "wellness"],
  "location": {                       // Free-form for now (no Google Maps yet)
    "name": "Gold's Gym Downtown",
    "lat": null,
    "lng": null
  },
  "startTime": ISODate("2026-02-10T14:30:00Z"),
  "host": { "id": "<user.id>", "name": "Alice Scaler" },
  "hostEmailDomain": "sst.scaler.com",         // ⭐ Used to scope who sees this flare
  "hostUniversity": "Scaler School of Technology",
  "attendees": [ { "id": "<user.id>", "name": "Bob Scaler" } ],
  "maxAttendees": 4,
  "createdAt": ISODate("…"),
  "updatedAt": ISODate("…")
}
```

**Indexes to consider adding**:
`{ hostEmailDomain: 1, startTime: 1 }`, `{ "host.id": 1 }`, `{ "attendees.id": 1 }`.

### 5.3 Legacy migration

On every server start, the first `/api` request triggers
`ensureMigrated(db)` in `app/api/[[...path]]/route.js`. It:

1. Backfills `emailDomain` on any user missing it (derived from `email`).
2. Backfills `hostEmailDomain` on any flare missing it (via a lookup on the
   host user's `email` / `emailDomain`).

The function is **idempotent** — it sets a module-level `migrated = true`
flag so it only runs once per process.

---

## 6. Working with the DB

### 6.1 Quick health check (from the container shell)

```bash
mongosh mongodb://localhost:27017 --quiet --eval '
  const d = db.getSiblingDB("iflare");
  print("users : " + d.users.countDocuments());
  print("flares: " + d.flares.countDocuments());
'
```

Current counts (at the time of writing): **8 users, 7 flares**.

### 6.2 Interactive shell

```bash
mongosh mongodb://localhost:27017
use iflare
show collections
```

Useful queries once inside `mongosh`:

```javascript
// List all users (hide password)
db.users.find({}, { password: 0 }).pretty()

// One user by email
db.users.findOne({ email: "alice.test@sst.scaler.com" }, { password: 0 })

// All users of one university
db.users.find({ emailDomain: "sst.scaler.com" }, { name: 1, email: 1, _id: 0 })

// All flares hosted by a specific user
db.flares.find({ "host.id": "<user-uuid>" }).pretty()

// All flares visible to a Scaler student
db.flares.find({ hostEmailDomain: "sst.scaler.com" }).pretty()

// Latest 5 flares created
db.flares.find({}).sort({ createdAt: -1 }).limit(5).pretty()

// Every user + count of flares they host + count they attend
db.users.aggregate([
  { $lookup: { from: "flares", localField: "id", foreignField: "host.id", as: "hosted" } },
  { $lookup: { from: "flares", localField: "id", foreignField: "attendees.id", as: "joined" } },
  { $project: { _id: 0, name: 1, email: 1, university: 1,
                hostedCount: { $size: "$hosted" },
                joinedCount: { $size: "$joined" } } }
])
```

### 6.3 Backup / restore

```bash
# Dump the whole iflare DB to /tmp/iflare-dump/
mongodump --uri="mongodb://localhost:27017" --db=iflare --out=/tmp/iflare-dump

# Export a single collection as JSON
mongoexport --uri="mongodb://localhost:27017" --db=iflare --collection=users \
            --out=/tmp/users.json --jsonArray

# Restore from a dump
mongorestore --uri="mongodb://localhost:27017" /tmp/iflare-dump
```

### 6.4 GUI options

`mongosh` is CLI-only in the container. For a graphical view:

- **MongoDB Compass** (desktop app, free). Requires the DB to be reachable
  from your machine. The preview container's MongoDB is bound to
  `localhost` inside the container, so you'd need to expose port `27017`
  or SSH-tunnel it — usually not worth the trouble; `mongosh` covers 99%.
- Post-deploy: use whichever DB explorer Emergent surfaces for the
  production MongoDB.

### 6.5 Danger zone

```javascript
// Delete a single user (also delete their flares)
db.users.deleteOne({ email: "someone@example.com" })
db.flares.deleteMany({ "host.id": "<user-uuid>" })

// Wipe everything (careful!)
db.users.deleteMany({})
db.flares.deleteMany({})

// Nuke the whole DB
db.dropDatabase()
```

---

## 7. API Reference

Base URL: `${NEXT_PUBLIC_BASE_URL}/api`
All routes below are relative to `/api`. All requests/responses are JSON.
CORS is permissive (`*`).

Every request first triggers `ensureMigrated(db)` (idempotent, cheap after
first run).

### 7.1 Auth

| Method | Route                          | Body                                                        | Notes |
| ------ | ------------------------------ | ----------------------------------------------------------- | ----- |
| POST   | `/auth/register`               | `{ name, email, password, interests: string[] }`            | 400 if email domain isn't an Indian university. Returns `{ user, token }`. |
| POST   | `/auth/login`                  | `{ email, password }`                                       | Returns `{ user, token }`. `user` includes `university` + `emailDomain`. |
| POST   | `/auth/verify`                 | `{ token }`                                                 | Currently unused (email verify disabled). |
| POST   | `/auth/resend-verification`    | `{ email }`                                                 | Currently unused. |

**Token format** (base64-encoded JSON):
```
Buffer.from(JSON.stringify({ userId, timestamp })).toString('base64')
```
Not a real JWT — no signature. Adequate for MVP; **hardening required for
production** (see § 8).

### 7.2 Users

| Method | Route                          | Body / Params                                       | Notes |
| ------ | ------------------------------ | --------------------------------------------------- | ----- |
| GET    | `/user/me`                     | Header: `Authorization: Bearer <token>`             | Returns the logged-in user. |
| PUT    | `/user/interests`              | `{ userId, interests[] }`                           | Requires ≥3 interests. |
| PUT    | `/user/settings`               | `{ userId, interests?, visibilityMode? }`           | `visibilityMode` is legacy / ignored by the new scoping. |
| GET    | `/user/:userId/activity`       | –                                                   | Returns `{ created: Flare[], joined: Flare[] }`. |
| GET    | `/user/:userId/flares`         | –                                                   | All flares where user is host OR attendee. |

### 7.3 Flares

| Method | Route                          | Body / Params                                                                                                          | Notes |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----- |
| POST   | `/flares`                      | `{ title, description, interests[], location, startTime, maxAttendees, hostId, hostName }`                             | Stamps `hostEmailDomain` + `hostUniversity` from host's user record. |
| GET    | `/flares?interests=a,b&userId=<uuid>` | Optional `interests` filter. If `userId` is provided, results are **scoped to that user's `emailDomain`** (university). | Returns `Flare[]`. |
| POST   | `/flares/:flareId/join`        | `{ userId, userName, flareData? }`                                                                                     | If the flare doesn't exist yet (client sample data), `flareData` will be used to create it. |

> ⚠️ **Backend does not currently enforce that the requester belongs to the
> host's university** — it only filters GET results. A malicious client
> that knows a flare ID could still POST `/flares/:flareId/join` across
> universities. Cross-campus join blocking is a future hardening item.

---

## 8. Security Notes (for future hardening)

Current MVP uses lightweight primitives that are **not production-grade**:

- **Password hashing:** plain SHA-256 with no salt.
  → Switch to `bcrypt`/`argon2` with per-user salt.
- **Session token:** unsigned base64 JSON.
  → Switch to signed JWT (`jose` / `jsonwebtoken`) or server-side sessions.
- **CORS:** wide open (`*`).
  → Restrict via `CORS_ORIGINS` env var in production.
- **Rate limiting:** none.
  → Add on `/auth/*` and `/flares` POSTs.
- **Cross-university join:** not enforced at the join endpoint (see § 7.3).
- **Email verification:** intentionally disabled.
  → Re-enable when going live.

---

## 9. Key Feature Notes

### 9.1 University-only visibility

- Whitelist + rules live in `/app/lib/universities.js`.
- `resolveUniversity(email)` returns `{ valid, name, domain, reason }`.
- Accepts:
  1. Any domain listed explicitly in `INDIAN_UNIVERSITY_DOMAINS`.
  2. Any subdomain of a listed domain (e.g. `cse.iitb.ac.in`).
  3. Any `.ac.in` or `.edu.in` TLD (Indian academic).
- To add a new campus: append `'<domain>': 'Human-readable name'` to
  `INDIAN_UNIVERSITY_DOMAINS` in `/app/lib/universities.js`.

### 9.2 Onboarding walkthrough

- Component: `/app/components/OnboardingWalkthrough.js`
- Mounted at the top of `/app/app/flares/page.js`.
- Shown once per browser — gated by `localStorage.iflare_onboarding_seen`.
- **Reset for a user (DevTools console):**
  ```javascript
  localStorage.removeItem('iflare_onboarding_seen'); location.reload();
  ```

### 9.3 Notifications

- In-app only (no push yet). Context lives in `/app/lib/NotificationProvider.js`.
- Bell icon with unread badge appears in the header of `/flares`.
- Firing helpers are in `/app/lib/notifications.js`.

### 9.4 Server-date workaround

- The container clock is set to 2026, which broke time-based backend
  filtering. As a temporary fix, time-window logic was removed from
  `GET /flares` and moved to the client. See § 8 backlog.

---

## 10. Running & Restarting

Everything is run through supervisor — **do not** launch `next dev`
manually.

```bash
sudo supervisorctl status              # what's running
sudo supervisorctl restart nextjs      # after installing new deps / .env change
sudo supervisorctl restart all         # nuclear option

tail -n 200 /var/log/supervisor/nextjs.out.log  # server logs
tail -n 200 /var/log/supervisor/nextjs.err.log  # errors
```

Frontend hot-reload picks up file edits automatically; restarts are only
needed for `.env` changes or new npm dependencies.

---

## 11. Deploying

1. **Push to GitHub:** use the **"Save to GitHub"** button in the Emergent
   chat input. (The main agent is not allowed to run `git push` — this is
   the sanctioned way.)
2. **Deploy:** use the **Deploy** button in the Emergent workspace UI.
   Emergent provisions a production MongoDB, injects env vars, builds and
   hosts the app. First deploy takes ~2–5 minutes; subsequent deploys are
   faster.
3. **Preview DB ≠ Production DB.** Test data made in the preview does not
   travel to production and vice-versa.

---

## 12. Known Backlog

- Re-enable email verification via Resend.
- Google Login (postponed).
- Google Maps venue picker (currently free-text `location.name`).
- Password reset flow.
- Cross-university join enforcement at `/flares/:id/join`.
- Server-side push notifications.
- Fix / robust-ify time-based backend filtering (server clock issue).
- Split monolithic `/app/api/[[...path]]/route.js` into feature-specific
  route folders for maintainability.
- Break down large `/app/app/flares/page.js` into smaller components.

---

*Last updated: Feb 2026 — this doc lives at `/app/DEVELOPMENT.md`. Keep it
in sync when the schema or endpoints change.*
