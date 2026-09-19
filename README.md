# NSS Connect

Digital management system for NSS (National Service Scheme) volunteers, events, attendance, certificates, and compliance reporting — a Next.js + Prisma + Supabase replacement for manual/Excel-based NSS tracking.

See [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) for the original plan and open decisions, and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the diagram-first, kept-current reference to the actual folder structure, frontend/backend layering, and database schema.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Prisma → Postgres (Supabase)
- Supabase Auth (email/password) + Storage (certificate PDFs)
- Zod validation at every API boundary
- `pdf-lib` for certificate rendering, `qrcode` for Digital ID / check-in QR codes
- Vitest (unit) + Playwright (e2e)

## Getting started

1. Copy `.env.example` to `.env` and fill in a Supabase project's URL/keys, a Postgres connection string, and `APP_SIGNING_SECRET` (`openssl rand -hex 32`).
2. Install dependencies:

   ```bash
   npm install
   ```

3. Push the schema and seed sample data:

   ```bash
   npm run prisma:generate
   npm run db:push
   npm run prisma:seed
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run db:push` | Push `prisma/schema.prisma` without a migration (quick local setup) |
| `npm run prisma:seed` | Seed 3 admin (2 coordinator, 1 auditor) + 10 volunteer demo accounts that can actually log in (see below) |

## Demo accounts

`npm run prisma:seed` creates real, pre-confirmed Supabase Auth users (not just
Prisma rows — a `User` row with no matching `auth.users` entry can never log
in) for 3 admins and 10 volunteers, all sharing one password. Needs
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`. Safe to
re-run; it skips accounts and profiles that already exist.

- Password for every seeded account: `NssDemo#2026` (override with
  `DEMO_SEED_PASSWORD` in `.env`)
- Admins: `admin.priya@nssdemo.local`, `admin.arun@nssdemo.local` (coordinators,
  full access), `auditor.meera@nssdemo.local` (auditor, read-only)
- Volunteers: `v.aditya@nssdemo.local` through `v.lakshmi@nssdemo.local` (see
  `prisma/seed.ts` for the full list) — a mix of `ACTIVE`, `APPLIED`,
  `ALUMNI`, and `INACTIVE` statuses so the admin approval workflow has
  something to demo

## Roles

Two login flows plus one public route — see `docs/PROJECT_CONTEXT.md` §2 for the full model:

- **Volunteer** (`role = VOLUNTEER`) — `/dashboard`, `/profile`, `/events`, `/attendance/scan`, `/certificates`, `/announcements`. Unit leads (`isLead = true`) additionally get access to `GET /api/events/[id]/token` to project a live check-in QR.
- **Admin** (`role = COORDINATOR` or `AUDITOR`) — `/admin/dashboard`, `/admin/volunteers`, `/admin/events`, `/admin/certificates`, `/admin/announcements`, `/admin/reports`. Auditors get read-only access; every mutating route rejects them server-side regardless of what the UI shows.
- **Public** — `GET /verify/[hash]`, no login required.
