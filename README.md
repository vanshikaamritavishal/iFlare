# iFLARE

> **Real connections. Right now.**
>
> A mobile-first web app that lets Indian college students spark
> spontaneous, interest-based meetups (called **iFlares**) with peers from
> **their own university only**.

<p align="center">
  <em>Study buddies, gym partners, coffee runs, cycling groups, Catan nights —
  all discovered spontaneously within your campus community.</em>
</p>

---

## ✨ Features

- **University-scoped feed** — a student registered with `@sst.scaler.com`
  only sees iFlares created by other Scaler students. IIT KGP students only
  see IIT KGP flares. And so on.
- **Curated Indian-university whitelist** — IITs, NITs, IIITs, IIMs, BITS,
  VIT, Manipal, Amity, Ashoka, Scaler, and every `.ac.in` / `.edu.in`
  campus is accepted. Personal email providers (gmail, yahoo, outlook,
  hotmail, icloud, …) are blocked at every layer.
- **Create & join iFlares** — title, description, venue, start time,
  interest tags, and party size (2–10).
- **Activity tab** — shows every flare you’ve created and every one you’ve
  joined, split into tabs.
- **Interest-based ranking** — your interests build a persona that
  influences what surfaces first in the Flares feed.
- **In-app notifications** — bell + unread badge alert you to new flares
  matching your interests.
- **Per-iFlare chat** — a minimal group chat lives inside every iFlare
  detail sheet. Only the host and attendees can read or write; messages
  poll every 6 s while the sheet is open so the app stays quiet when
  you're not looking. Signal, not noise: no reactions, typing indicators,
  or read receipts.
- **First-time walkthrough** — a 5-slide intro modal guides new users
  through the app, once per browser.

---

## 🧱 Tech Stack

| Layer          | Choice                                             |
| -------------- | -------------------------------------------------- |
| Framework      | Next.js 14 (App Router)                            |
| Language       | JavaScript (JSX)                                   |
| Styling        | Tailwind CSS + shadcn/ui                           |
| Icons          | lucide-react (Radar is the brand mark)             |
| Database       | MongoDB (local in preview, managed in production)  |
| Auth           | Custom (email + SHA-256 password + base64 token)   |
| Email (opt-in) | Resend (currently disabled in the signup flow)     |
| Process mgr    | supervisor (nextjs on `0.0.0.0:3000`)              |

---

## 📁 Project Layout

```
/app
├── app/
│   ├── api/[[...path]]/route.js   # Monolithic API — all endpoints
│   ├── page.js                    # Landing page (/)
│   ├── login/, register/, verify/ # Auth routes
│   ├── flares/                    # Main dashboard
│   ├── activity/                  # Created + joined flares
│   ├── profile/                   # Interests + university card
│   ├── icon.svg                   # Favicon (orange radar)
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── OnboardingWalkthrough.js   # 5-slide first-time modal
│   ├── ClientProviders.js
│   └── ui/                        # shadcn/ui primitives
├── lib/
│   ├── universities.js            # University whitelist + blocklist
│   ├── NotificationProvider.js
│   └── notifications.js
├── memory/
│   └── test_credentials.md        # Test accounts
├── DEVELOPMENT.md                 # Deep-dive dev docs (schema, DB, API)
├── README.md                      # ← you are here
└── .env                           # Never commit real values
```

---

## 🚀 Getting Started (in the Emergent workspace)

Everything is already wired up. Services are managed by `supervisor`, so
you do **not** run `next dev` yourself.

```bash
# See what's running
sudo supervisorctl status

# Restart after editing .env or installing new deps
sudo supervisorctl restart nextjs

# Tail logs
tail -n 200 /var/log/supervisor/nextjs.out.log
```

Frontend hot-reload picks up file edits automatically.

---

## 🔐 Environment Variables (`/app/.env`)

| Variable                | Purpose                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `MONGO_URL`             | MongoDB connection string                                        |
| `DB_NAME`               | Database name (currently `iflare`)                                |
| `NEXT_PUBLIC_BASE_URL`  | Public base URL of the preview / production app                  |
| `RESEND_API_KEY`        | Resend API key (email verification, currently disabled in flow)  |
| `CORS_ORIGINS`          | Optional CORS override (default `*`)                             |

> ⚠️ Never edit `MONGO_URL` or `NEXT_PUBLIC_BASE_URL` — these are managed
> by the Emergent platform.

---

## 🗄 Where is the data stored?

- **Preview:** MongoDB runs inside the same container as the app. Data
  lives on the container’s persistent disk and survives code edits,
  restarts, and GitHub pushes.
- **Production (after Deploy):** a separate, isolated production MongoDB
  is provisioned. Data persists across future code deploys — pushing new
  code does **not** wipe accounts or flares.
- **Preview and Production DBs are entirely separate.**

To inspect your data:

```bash
mongosh mongodb://localhost:27017 --quiet --eval '
  const d = db.getSiblingDB("iflare");
  print("users : " + d.users.countDocuments());
  print("flares: " + d.flares.countDocuments());
'
```

Full DB schema, queries, and dump/restore workflows are in
[`DEVELOPMENT.md`](./DEVELOPMENT.md).

---

## 🔗 Key API Endpoints

| Method | Route                            | Purpose                                          |
| ------ | -------------------------------- | ------------------------------------------------ |
| POST   | `/api/auth/register`             | Register (validates Indian university domain)    |
| POST   | `/api/auth/login`                | Login (rejects blocked domains at 403)           |
| GET    | `/api/user/me`                   | Current user from Bearer token                   |
| PUT    | `/api/user/interests`            | Update user’s interest tags                      |
| PUT    | `/api/user/settings`             | Update interests (visibility mode legacy)        |
| GET    | `/api/user/:id/activity`         | Created + joined flares for a user               |
| POST   | `/api/flares`                    | Create a flare (auto-stamps `hostEmailDomain`)   |
| GET    | `/api/flares?userId=<id>`        | List flares scoped to user’s university          |
| POST   | `/api/flares/:id/join`           | Join a flare                                     |
| GET    | `/api/flares/:id/messages`       | Chat: list messages (participants only)          |
| POST   | `/api/flares/:id/messages`       | Chat: send a message (participants only)         |

Full spec in [`DEVELOPMENT.md`](./DEVELOPMENT.md#7-api-reference).

---

## 🛡 University Domain Rules (`/app/lib/universities.js`)

A registration is accepted if the email domain:

1. Is on the explicit **INDIAN_UNIVERSITY_DOMAINS** whitelist (IITs, NITs,
   IIITs, IIMs, Scaler, BITS, VIT, Manipal, Amity, Ashoka, and many more), **or**
2. Is a subdomain of any whitelisted domain (e.g. `cse.iitb.ac.in`), **or**
3. Ends with `.ac.in` or `.edu.in` (Indian academic TLDs).

It is **rejected** if the domain is in **BLOCKED_DOMAINS** (`gmail.com`,
`googlemail.com`, `yahoo.*`, `outlook.com`, `hotmail.*`, `live.com`,
`msn.com`, `icloud.com`, `me.com`, `mac.com`, `aol.com`, `protonmail.com`,
`proton.me`, `pm.me`, `zoho.com`, `gmx.com`, `rediffmail.com`,
`mail.com`, `fastmail.com`, `tutanota.com`, `inbox.com`).

Blocking is enforced at **four layers**:

1. Client-side on `/register` step 1 (`handleNextStep`).
2. Backend `POST /api/auth/register`.
3. Backend `POST /api/auth/login` (403 for blocked domains).
4. All pre-existing gmail accounts were wiped from the DB.

---

## 🧪 Test Accounts

See [`/app/memory/test_credentials.md`](./memory/test_credentials.md).
Suggested pattern for manual testing:

- Two same-university users (Scaler A & B) — they should see each other’s flares
- One different-university user (IIT KGP) — must **not** see Scaler flares
- Any personal-email address — must be blocked at register step 1

---

## 🚢 Deploying

1. **Push to GitHub** using the **Save to GitHub** button in the Emergent
   chat input (git write commands are not run by the agent).
2. **Deploy** with the **Deploy** button in the workspace UI. Emergent
   provisions a production MongoDB, injects env vars, builds, and hosts.
   First deploy takes ~2–5 minutes.

Preview data does **not** travel to production and vice-versa.

---

## 🗺 Roadmap / Backlog

- Re-enable email verification via Resend
- Google Login (postponed)
- Google Maps venue picker (currently free-text `location.name`)
- Password reset flow
- Cross-university join enforcement on `/api/flares/:id/join`
- Server-side push notifications
- Split the monolithic API route into feature folders
- Split the large `flares/page.js` into smaller components
- Robust time-based filtering (blocked by server-clock drift in preview)

---

## 🔒 Security Notes

Current MVP intentionally uses lightweight primitives for speed of
iteration. Before a real launch:

- Replace SHA-256 with **bcrypt** or **argon2** (with per-user salt).
- Replace the base64 JSON session token with a **signed JWT** (`jose`
  recommended) or server-side sessions.
- Restrict `CORS_ORIGINS` to your production origin.
- Add rate-limiting on `/api/auth/*` and `POST /api/flares`.
- Enforce cross-university guards at `POST /api/flares/:id/join`.
- Re-enable email verification.

See [`DEVELOPMENT.md § 8`](./DEVELOPMENT.md#8-security-notes-for-future-hardening)
for the full checklist.

---

## 📚 Further Reading

- **[`DEVELOPMENT.md`](./DEVELOPMENT.md)** — full developer documentation:
  database schema, all API endpoints, working with MongoDB, backup/restore,
  security hardening, feature-level notes.
- **[`/app/memory/test_credentials.md`](./memory/test_credentials.md)** —
  suggested test accounts.

---

*Built with Next.js + MongoDB inside the Emergent platform. Feb 2026.*
