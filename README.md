# BRAND (working name)

Upload a resume, get a hosted personal site and a print-ready business card with a QR code that points to it. See `CLAUDE.md` for the full spec, decisions, and status.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev                   # http://localhost:3000/kaeden
```

With no `DATABASE_URL`, `/kaeden` renders from the built-in seed so you can work on the UI. Signed-in pages (`/start`, `/edit`, `/dashboard`) need Clerk keys.

### Database (Railway Postgres)

In Railway, add a PostgreSQL service and copy its `DATABASE_PUBLIC_URL` into `DATABASE_URL` (locally in `.env.local`, and in Vercel's environment variables). The private `postgres.railway.internal` URL only works inside Railway.

```bash
npm run db:migrate   # apply drizzle/*.sql
npm run db:seed      # insert Kaeden's profile at /kaeden
```

After changing `src/db/schema.ts`, run `npm run db:generate` and commit the new migration.

## Checks

```bash
npm run typecheck && npm run lint && npm run build
```

## Layout

```
src/app/[slug]/            public profile page
src/app/(app)/             signed-in app (Clerk), sign-in/up
src/components/profile/    carousel, contact-only page, profile.css (ported from the reference)
src/db/                    Drizzle schema, client, seed script
src/lib/                   validation (Zod), slugs + QR codes, sanitizing, profile loader
src/seed/kaeden.ts         seed profile data
reference/                 Kaeden's live site and resume (source of truth for the template)
```
