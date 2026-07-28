# Maitra Jewellery — Setup & Deployment

Full-stack Next.js 16 app: storefront + admin dashboard + API in one project.

| Piece | Technology |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database | Supabase Postgres via Prisma **6.19** |
| Media | Cloudinary (images + video) |
| Customer auth | Phone OTP over SMS (MSG91 / Fast2SMS) |
| Admin auth | Username + bcrypt password, JWT session cookie |

### Two constraints Cloudflare imposes

Both are worked around in this repo, but you should know they exist:

1. **Prisma is pinned to 6.19.0.** Prisma 7 compiles its query-compiler WASM at
   runtime, which Workers forbid (`Wasm code generation disallowed by embedder`).
   Tracked upstream at [prisma#28657](https://github.com/prisma/prisma/issues/28657) —
   still open. Do not upgrade Prisma until it closes.
2. **Routing config lives in `middleware.ts`, not `proxy.ts`.** Next 16 renamed
   the convention and forces `proxy.ts` onto the Node runtime, which the
   Cloudflare adapter cannot run. `middleware.ts` (Edge) is deprecated in Next 16
   but still works — **the deprecation warning on each build is expected.**

Neither applies on Vercel, where the app runs unmodified.

---

## 1. Accounts you need

1. **Supabase** — <https://supabase.com>, create a project (free tier is fine).
2. **Cloudinary** — <https://cloudinary.com>, free tier covers ~25 GB.
3. **MSG91** (<https://msg91.com>) or **Fast2SMS** (<https://fast2sms.com>) for OTP SMS.
   > Indian transactional SMS requires TRAI **DLT registration** of a sender ID and
   > message template. It takes a few days. Until it's approved, leave
   > `OTP_PROVIDER=console` and OTP login works in development with the code printed
   > to the server log — no code changes needed when you switch over.

### Local development without Supabase

A throwaway Postgres in Docker is enough to run everything locally. This machine
is already set up this way — the container is named `maitra-postgres` and listens
on **5544** (5432 and 5433 are taken by the installed PostgreSQL 12 and 17):

```bash
docker start maitra-postgres          # after a reboot
```

To recreate it from scratch:

```bash
docker run -d --name maitra-postgres \
  -e POSTGRES_PASSWORD=maitra_dev_pw -e POSTGRES_DB=maitra \
  -p 5544:5432 postgres:17-alpine
```

with both URLs in `.env.local` set to:

```
postgresql://postgres:maitra_dev_pw@127.0.0.1:5544/maitra
```

This is for development only — Vercel still needs a real Supabase database.

## 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

- **`DATABASE_URL`** — Supabase → Project Settings → Database → Connection string →
  **Transaction** mode (port **6543**). Keep `?pgbouncer=true&connection_limit=1`.
- **`DIRECT_URL`** — the same string on port **5432** (Session mode).
  Migrations need a direct connection; the pooler can't run them.
- **`AUTH_SECRET`** and **`ANALYTICS_SALT`** — generate each with
  `openssl rand -base64 48`. Rotating `AUTH_SECRET` signs everyone out.
- **`ADMIN_USERNAME` / `ADMIN_PASSWORD`** — the dashboard login. Username
  defaults to `maitra@admin`; you choose the password. It is bcrypt-hashed
  before storage, and `npm run seed` applies whatever is currently set — so
  changing it here and re-running the seed rotates it.
  **Never commit the real password.** It belongs in `.env.local` (gitignored)
  and in Cloudflare's secrets — not in `.env.example` or these docs.
- **Cloudinary** — the three keys plus `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

## 3. Create the schema and migrate existing data

```bash
npm install
npm run db:migrate      # creates all tables (first run: name it "init")
npm run seed            # migrates the existing catalogue + creates the admin
```

`npm run seed` imports everything from the old hardcoded `lib/products.ts`:

- 5 categories
- 22 products with **names, descriptions, prices, offer (compare-at) prices,
  highlights and featured flags**
- all 34 images from `public/products/`, in their original gallery order
- 3 starter shipping regions and the editable site settings

It finishes with a **verification pass** that reads every record back and compares
it field by field against the source. Any missing product, wrong price, dropped
offer price or missing image fails the run with an explicit list. It is safe to
re-run: everything is an upsert, and galleries you've since edited in the admin
are left alone.

> Product images stay as files in `public/products/` and are served by Next.
> The database stores their paths. Nothing is moved or deleted.

## 4. Run it

```bash
npm run dev     # http://localhost:3000
```

- Storefront — `/`
- Admin portal — `/admin` (redirects to `/admin/login`)
- Customer sign-in — `/login`

## 5. Deploy to Cloudflare

### Build settings (Workers → connect to Git)

| Setting | Value |
| --- | --- |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx wrangler deploy` |
| Build output directory | `.open-next` |

Or deploy straight from your machine with `npm run cf:deploy`.

### Secrets

Runtime secrets go in **Workers → Settings → Variables and Secrets** (or
`npx wrangler secret put NAME`). Set every non-`NEXT_PUBLIC_` value from
`.env.local`:

`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `ANALYTICS_SALT`,
`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CLOUDINARY_*`, `OTP_PROVIDER`, `MSG91_*`.

> **`NEXT_PUBLIC_SITE_URL` is different.** It is inlined at *build* time, so it
> must be a **build variable**, not a secret. If it is missing, every canonical
> link and share preview falls back to a `workers.dev` placeholder.

Set `OTP_PROVIDER` to `msg91` or `fast2sms` — the app **refuses to send OTPs in
production** while it is `console`, since that mode returns the code in the API
response.

### Hyperdrive (do this before real traffic)

Without it every request opens a fresh Postgres connection, which is slow and
will exhaust Supabase's connection limit under load:

```bash
npx wrangler hyperdrive create maitra-db \
  --connection-string="postgresql://USER:PASS@HOST:5432/postgres"
```

Uncomment the `hyperdrive` block in `wrangler.jsonc` with the returned id.
`lib/db.ts` already prefers that binding when it exists.

### Image transformations

`next/image` is served by `image-loader.ts`, not Next's optimizer (which does not
run on Cloudflare).

- **Cloudinary URLs** always use Cloudinary's own transforms — works everywhere.
- **`/public` files** are served as-is by default.

Cloudflare's `/cdn-cgi/image/` resizing is **opt-in**, because it only exists on
a **custom domain** with Images → Transformations enabled. It does **not** work
on localhost or on `*.workers.dev` — enabling it there 404s every product photo.

Once you have a real domain attached, set the build variable:

```
NEXT_PUBLIC_CF_IMAGE_TRANSFORMS=true
```

Leave it `false` (the default) until then.

### Migrations

Run these from your machine against the production database — they are not part
of the Worker build:

```bash
npm run db:deploy    # apply migrations
npm run seed         # first deploy only: catalogue + admin account
```

### If you would rather use Vercel

The app runs there with none of the above workarounds — no adapter, no Prisma
pin, no custom image loader, and `proxy.ts` instead of the deprecated
`middleware.ts`. Push the repo, import at <https://vercel.com/new>, add the same
variables, and deploy.

---

## Admin dashboard

| Page | What it does |
| --- | --- |
| `/admin` | Revenue, orders, site visits, unique visitors, 14-day charts, best sellers, most-visited pages |
| `/admin/orders` | Every order with phone number and delivery address; filter by status; update order + payment status |
| `/admin/products` | Full CRUD, drag-and-drop multi-image and video upload, categorisation, stock, featured |
| `/admin/categories` | Category CRUD |
| `/admin/shipping` | Region-based delivery charges |
| `/admin/customers` | Registered customers and lifetime value |
| `/admin/settings` | Announcement bar, contact and UPI details |

### How shipping rules resolve

Most specific wins:

1. **PIN code prefix** — longest match (`682` beats `68`)
2. **State** — exact name match against the checkout dropdown
3. **Default rule** — the one flagged `isDefault`

`freeAbove` makes delivery free once the subtotal reaches it. The charge is always
recalculated server-side when the order is placed — the browser never sends prices.

⚠️ Keep exactly one **active default** rule. Without it, destinations you haven't
listed are charged ₹0 delivery. The dashboard warns you if none exists.

---

## Security notes

- **12 CVEs patched** — Next.js upgraded to 16.2.12 (9 advisories, including
  middleware bypass, SSRF and cache confusion), with `postcss` and `sharp` pinned
  via npm `overrides`. **`npm audit --omit=dev` reports 0 vulnerabilities**, so
  nothing that ships to production is affected.

  `npm audit` (including dev dependencies) still reports 9 high advisories. All
  of them come from one transitive package — `brace-expansion`, reached through
  `minimatch` inside the ESLint toolchain. They are lint-time only and never
  reach the browser or the server bundle. The advisory's fixed version (5.0.8) is
  API-incompatible with the `minimatch` that ESLint and `eslint-config-next`
  depend on, so forcing it breaks linting entirely; it was tried and reverted.
  It resolves upstream when `eslint-config-next` ships a newer `minimatch`.
- **Admin routes** are gated in Edge middleware (`proxy.ts`) *and* re-checked
  against the database in each route handler. Router prefetches are deliberately
  not exempted, so admin RSC payloads can't leak to signed-out visitors.
- **CSP with a per-request nonce**, plus HSTS, `X-Frame-Options: DENY`,
  `nosniff`, and a restrictive `Permissions-Policy`.
- **Passwords** bcrypt-hashed at cost 12. Login compares against a dummy hash when
  the user doesn't exist, so response timing doesn't reveal valid usernames.
- **OTP codes** are stored only as bcrypt hashes, expire in 5 minutes, allow 5
  attempts, are single-use, and are invalidated when a new one is requested.
- **Rate limiting** is Postgres-backed, not in-memory — serverless instances don't
  share memory, so an in-memory counter would reset on every cold start.
- **CSRF** — session cookies are `httpOnly` + `SameSite=Lax`, and every mutating
  endpoint verifies `Origin` against `Host`.
- **Prices are never trusted from the client.** Checkout accepts only slugs and
  quantities; the server looks up every price and recomputes shipping.
- **Analytics store no raw IPs** — only a salted SHA-256 of IP + user agent.
- **Uploads** go browser → Cloudinary with a server-minted signature, so the API
  secret never reaches the browser and large videos never pass through the
  Worker's request-body limit.

## Commands

```bash
npm run dev          # Next dev server (fast iteration)
npm run build        # Next production build (runs prisma generate)
npm run lint         # eslint
npm run seed         # migrate catalogue + create admin (safe to re-run)
npm run db:migrate   # create/apply a migration in development
npm run db:deploy    # apply migrations in production
npm run db:studio    # browse the database

# Cloudflare
npm run cf:build     # build the Worker bundle into .open-next
npm run cf:preview   # run the real Worker runtime locally (uses .dev.vars)
npm run cf:deploy    # build and deploy to Cloudflare
npm run cf:typegen   # regenerate cloudflare-env.d.ts from wrangler.jsonc
```

> **Building on Windows:** `cf:build` needs to create symlinks, which Windows
> blocks unless Developer Mode is on (Settings → Privacy & security → For
> developers) or the shell is elevated. `npm run dev` is unaffected, and
> Cloudflare's own Linux builders have no such restriction — so this only
> matters if you want to produce the Worker bundle locally.
