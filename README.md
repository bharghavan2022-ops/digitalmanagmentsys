# NSS Connect

Digital management system for NSS (National Service Scheme) volunteers, events, attendance, certificates, and compliance reporting — a Next.js + Prisma + Supabase replacement for manual/Excel-based NSS tracking.

See [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) for the full architecture, schema, and module specification this scaffold implements.

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
| `npm run prisma:seed` | Seed a sample coordinator + volunteer |

## Roles

Two login flows plus one public route — see `docs/PROJECT_CONTEXT.md` §2 for the full model:

- **Volunteer** (`role = VOLUNTEER`) — `/dashboard`, `/profile`, `/events`, `/attendance/scan`, `/certificates`, `/announcements`. Unit leads (`isLead = true`) additionally get access to `GET /api/events/[id]/token` to project a live check-in QR.
- **Admin** (`role = COORDINATOR` or `AUDITOR`) — `/admin/dashboard`, `/admin/volunteers`, `/admin/events`, `/admin/certificates`, `/admin/announcements`, `/admin/reports`. Auditors get read-only access; every mutating route rejects them server-side regardless of what the UI shows.
- **Public** — `GET /verify/[hash]`, no login required.
