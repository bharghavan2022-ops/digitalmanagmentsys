# NSS Digital Management System — Master Project Context

**Status:** Working context document — read this first in every future session on this project, alongside `nss_digital_management_system_full_chat_export.md` (raw research log), `provided info` (original brief), and the companion **`nss-claude-code-prompt-guide.md`** (the ordered, copy-pasteable build prompts for Claude Code).
**Owner:** Bharghav — ECE student, KARE. Acting roles on this thread: senior dev, CRM/DMS architect, mentor, teammate.
**Last updated:** 2026-09-18 (IST)
**Working name:** **NSS Connect** (placeholder — brief allows any team-chosen name; rename is a one-line change in Prompt 0 of the prompt guide).

---

## 0. How to use this document

This file is the single source of truth for architecture, schema, structure, and specs. It supersedes ad-hoc decisions scattered across the earlier research chat.

- **For build execution, use the separate `nss-claude-code-prompt-guide.md` doc.** This context doc is the reference the prompts point back to — don't paste this whole file into Claude Code as a prompt; paste the prompts from the guide one at a time, and keep this doc open as the spec they cite.
- This doc follows the Project's own **Autonomous Coding Agent Protocol** (see project instructions): minimal surgical diffs, no secrets in source, parameterized queries only, no swallowed exceptions, tests with every change.
- Keep this doc and the schema in sync as the build progresses — if a prompt in the guide adds/changes a model (see the Feedback model example in the guide's Prompt 8), update §4 here in the same pass.

> **Note (2026-09-18):** `nss-claude-code-prompt-guide.md`, `nss_digital_management_system_full_chat_export.md`, and `provided info` are referenced above but were not present in this repository when the initial scaffold was built. Add them alongside this file when available.

---

## 1. Product Summary

NSS activities (volunteers, events, registrations, attendance, certificates, community-service tracking) currently run on manual/Excel-based processes. The goal is one platform that lets **volunteers** discover and register for events, check in with verifiable attendance, track hours/achievements, and download verifiable certificates — while **Program Officers/coordinators** run events, verify attendance, mint certificates, and pull compliance reports (NAAC/NIRF-style) without manual spreadsheet compilation.

Ten required output modules (from the original brief), all accounted for in this doc: Dashboard, Volunteer Management, Event Management, Attendance Management, Achievements & Performance, Certificates, Communication, Officer/Admin Management, NSS Activity & Impact, Profile & Digital ID.

---

## 2. Roles & Access Model (finalized)

Decision from research: **5 conceptual personas, but only 2 login flows + 1 public route.** Do not build 5 separate portals — that's over-engineering for the timeline and the actual permission differences are flags, not identities.

| Persona | Login | Mechanism |
| :--- | :--- | :--- |
| Student Volunteer | Login #1 (Volunteer) | `role = VOLUNTEER` |
| Student Unit Leader | Login #1 (Volunteer) | `role = VOLUNTEER`, `isLead = true` → unlocks "Scan / Mark Attendance" inside the same dashboard |
| Program Officer / Coordinator | Login #2 (Admin) | `role = COORDINATOR` → full admin portal |
| Institutional Admin / IQAC Auditor | Login #2 (Admin) | `role = AUDITOR` → same admin portal, read-only (no create/edit buttons rendered, and API routes reject mutating verbs server-side, not just hidden in UI) |
| Public / External Verifier | No login | `GET /verify/[hash]` — public, unauthenticated, rate-limited |

**Enforcement rule for Claude Code:** role checks happen in the API layer (route handlers / server actions), never only in the UI. UI hiding a button is not access control.

---

## 3. Tech Stack — Recommended Track vs. Advanced Track

Two options were explored across the research thread. Rather than lose either, both are documented — but **the Recommended Track is the default the prompt guide builds**, because it matches your existing shipped stack (NNUTS Internal Tool, The Tile Store — Next.js/Supabase/Prisma/TypeScript) and is realistically buildable solo within an academic timeline. Swap to the Advanced Track only if you get a dedicated backend teammate and more runway.

### 3.1 Recommended Track (default)

| Layer | Choice | Why |
| :--- | :--- | :--- |
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Table | Single deployable, SSR where useful, matches your existing stack |
| Backend | Next.js Route Handlers / Server Actions (no separate service) | One codebase, one deploy target, no service-to-service auth to build |
| ORM | Prisma → Supabase Postgres | Type-safe schema/migrations you already use |
| Auth | Supabase Auth (email/password), custom `role`/`isLead` on a `User` row synced to `auth.users` | No hand-rolled password hashing/session code |
| Storage | Supabase Storage (avatars, certificate PDFs) | No separate S3/R2 account to provision |
| Validation | Zod at every API boundary | Matches your existing convention (NNUTS tool) |
| Attendance verification | Signed, short-lived JWT check-in token (regenerated every 30s client-side poll) + optional Haversine distance check using plain `lat/lng` columns | Approximates the rolling-TOTP idea from research without needing Redis |
| Certificates | `pdf-lib` (or `@react-pdf/renderer`) generated synchronously per certificate for MVP; SHA-256 hash via Node `crypto` | Avoids standing up Redis/BullMQ before there's a queueing problem to solve |
| Notifications | In-app `Announcement` feed; optional email via Resend | SMS/Twilio deferred — not needed for MVP |
| Testing | Vitest (unit/integration), Playwright (a handful of critical e2e flows) | Lightweight but real coverage |
| Deployment | Vercel (app) + Supabase (DB/Auth/Storage) | Free-tier friendly, matches your other projects |

### 3.2 Advanced Track (documented, not default)

The original research chat spec'd a heavier architecture: separate NestJS/Fastify backend, PostgreSQL + **PostGIS** for real geofencing, **Redis + BullMQ** for async certificate rendering and rolling 15s TOTP tokens, S3/Cloudflare R2 object storage, WebSocket pub/sub. This is the right shape **if this grows past one institution's NSS unit into a multi-college product** — keep this section as the upgrade path, not a rewrite trigger. Concretely: Redis becomes worth it when certificate batches exceed ~50–100 per event (synchronous generation starts blocking); PostGIS becomes worth it if you need shapes/polygons instead of a simple radius check.

---

## 4. Database Schema (Prisma, consolidated)

See `prisma/schema.prisma` — kept in sync with this section as the build progresses. Enums: `AppRole`, `VolunteerStatus`, `EventStatus`, `AttendanceState`. Models: `User`, `VolunteerProfile`, `Event`, `EventRegistration`, `Attendance`, `Certificate`, `Announcement`, `Feedback`, `AuditLog`.

`Feedback` (added, resolving open decision #3): one rating (1-5) + optional free-text message per volunteer per event, gated on `Attendance.state = VERIFIED_ATTENDED` for that event/volunteer pair - you can't leave feedback for an event you didn't actually attend. `@@unique([eventId, volunteerId])` caps it at one submission each. `POST /api/feedback` (volunteer) and `GET /api/feedback` (COORDINATOR/AUDITOR) in `src/app/api/feedback/route.ts`.

**Rules baked into this schema for Claude Code to respect:**
- `totalHoursServed` is a cached aggregate, never hand-incremented. It is recalculated from `Attendance` rows where `state = VERIFIED_ATTENDED`, joined to `Event.awardedHours`. Treat direct writes to this field as a bug.
- `AuditLog` gets a row on every attendance verification and certificate issuance at minimum (protocol requirement: verifiable histories).
- Uniqueness constraints (`[eventId, volunteerId]` on both registration and attendance) are the concurrency guard against duplicate check-ins — don't also try to hand-roll locking for this specific case.

> **Note:** the prompt guide's Prompt 8 adds a minimal `Feedback` model for the Communication module (not in the original brief's schema detail). Not yet added — see open decision #3 below.

---

## 5. Folder / File Structure

The scaffold follows the structure specified in the original context doc, with one deliberate deviation: **admin routes live under `/admin/*`** (`src/app/(admin)/admin/...`) rather than sharing top-level paths (`/dashboard`, `/events`, `/certificates`, `/announcements`) with the volunteer route group. The original structure had both `(volunteer)` and `(admin)` groups defining pages at the same literal paths (e.g. both defining `dashboard/page.tsx`), which Next.js App Router rejects at build time as an ambiguous route. Prefixing admin routes under `/admin` is the standard fix and keeps both portals under one deployable, as intended. A `post-login` redirect page routes each role to its own dashboard after sign-in.

See the repository tree for the current, authoritative structure.

---

## 6–9. Mindmaps, Module Specifications, Guardrails, Build Log

Unchanged from the original context — see the project's chat history for the full mindmaps (system overview, frontend, backend/API, database ER) and the module-by-module spec table (10 required modules). Non-functional guardrails (RBAC server-side, Zod at every boundary, audit log on verify/issue, no swallowed exceptions) are implemented in `src/lib/auth/rbac.ts`, `src/lib/validators/*`, and the route handlers under `src/app/api/**`.

---

## 10. Open Decisions (need your call)

1. **App name:** "NSS Connect" is a placeholder — used throughout the scaffold (page titles, metadata). Confirm or rename.
2. **Geolocation strictness:** current scaffold treats geo as advisory (recorded on `Attendance.geoDistanceMeters`, never blocks check-in). Confirm this is still the intended behavior.
3. ~~**Feedback model:** not yet added to `prisma/schema.prisma`. Confirm scope before adding.~~ Resolved: added (see §4) as a minimal one-rating-per-attended-event model. Revisit if the intended scope was broader (e.g. multi-question surveys).
4. **NAAC/NIRF-formatted PDF export:** only a CSV export exists so far (`/api/reports/export`). Confirm whether a formatted PDF export is required for the submission deadline.
5. **Team size:** scaffold assumes solo/small-team execution against the Recommended Track.

---

## 11. Related Documents

- **`nss-claude-code-prompt-guide.md`** — not present in this repository yet; add when available.
- `nss_digital_management_system_full_chat_export.md` — not present in this repository yet.
- `provided info` — not present in this repository yet.
