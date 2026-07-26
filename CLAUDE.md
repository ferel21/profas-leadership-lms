# CLAUDE.md - Memory & Project Documentation

## 🏷️ Project Overview
**PROFAS Leadership LMS** - Executive Leadership Academy & Learning Management System.
- **Type**: SaaS Learning Management System (LMS) / Interactive E-Learning Platform.
- **Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS / Vanilla CSS, Prisma ORM, NextAuth.js / Google OAuth, Vercel Serverless.
- **Current Status**: Live on Vercel Production (`https://profas-leadership-lms.vercel.app`) with dynamic Google OAuth callback and serverless SQLite auto-copying to `/tmp`.

---

## 🛠️ Essential Commands
- **Local Development**: `npm run dev` (Runs on port 3000)
- **Build**: `npm run build` (Executes Prisma generate, schema push, seeding, and Next.js production build)
- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint` (auto-fix mechanical issues: `npm run lint:fix`)
- **Duplicate-code check**: `npm run dup:check` (jscpd, config in `.jscpd.json`)
- **Smoke Test**: `npm run smoke`
- **Autopilot Loop**: `npm run autopilot:start` / `npm run autopilot:status`

---

## 🎨 Architectural & Style Guidelines
1. **Frontend Design**:
   - Prioritize modern **Glassmorphism** aesthetics (`backdrop-blur-md`, subtle semi-transparent borders, glowing gradients).
   - Dynamic dark/light mode compatibility.
   - Smooth micro-animations and responsive layouts.
2. **Backend & Database**:
   - Prisma ORM managing relational entities (User, Course, CourseNode, Assessment, Certificate, Enrollment).
   - Serverless compatibility: SQLite database (`dev.db`) is automatically copied to `/tmp/dev.db` in serverless environments (Vercel/AWS Lambda) to avoid read-only filesystem errors.
   - Prepared for future migration to Cloud PostgreSQL (Neon/Supabase).
3. **Coding Standards**:
   - Modular, clean TypeScript code with strict typing.
   - Avoid ad-hoc utility clutter; leverage reusable design tokens and components.
   - Preserve existing documentation and docstrings.
4. **Folder Structure** (adapted from standard React layout to Next.js App Router — `app/` stays at root for routing):
   - `app/` — routes only (App Router convention, cannot move).
   - `components/ui/` — small, reusable presentational components (Header, Footer, Logo, cards, chrome).
   - `components/shared/` — feature/business-logic components (CoursePlayer, Quiz, admin/mentor panels, export buttons).
   - `services/` — DB client, auth, rate-limit, uploads, and `services/export/` (docx/pdf/pptx/xlsx generators).
   - `utils/` — small pure helper functions.
   - `hooks/` — reusable client-side React hooks (e.g. `useLocalBackup`).
   - `context/` — reserved for React Context providers (empty until a real cross-cutting client state need appears).
   - `types/` — shared TypeScript types not already covered by Prisma-generated types.
   - `constants/` — reserved for cross-cutting constants (domain enums live in `prisma/schema.prisma` instead).
   - `styles/` — global CSS, imported from `app/layout.tsx`.

---

## 🔄 Self-Improvement & Progress Log
- **2026-07-26 [Phase 8 - Project Restructure & Auto-Fix Pipeline]**: Reorganized the codebase to match a standard React layout adapted for Next.js App Router: split `lib/` into `services/` (DB/auth/rate-limit/uploads) + `services/export/` (docx/pdf/pptx/xlsx generators) + `utils/`; split `components/` into `components/ui/` (presentational) and `components/shared/` (feature/business logic); moved global CSS into `styles/`; added `hooks/`, `context/`, `types/`, `constants/`. Deleted two dead/unimported CSS files (`landing.css`, `home-fresh.css`) and moved four unreferenced one-off patch scripts into `scripts/legacy/`. Eliminated real duplicate code: extracted a shared `ExportActionButton` (removed ~90% duplicated state-machine/markup across the four `Export*Button` components), extracted a `useLocalBackup` hook (removed an identical localStorage auto-backup/restore pattern duplicated between the course builder and quiz builder), and centralized the duplicated `NodeType` type into `types/course.ts`. Added tooling so this stays clean going forward: `jscpd` duplicate-code gate (`npm run dup:check`, threshold 3%, current baseline 1.96%), a husky + lint-staged pre-commit hook that runs `eslint --fix` on staged files, and a CI quality-gate template (`deploy/ci/quality.workflow.yml`, follows the existing template convention — copy into `.github/workflows/` once the repo token has `workflow` permission) that runs typecheck → autofix-and-commit → lint → duplicate-code check on every PR, blocking merge on real errors without ever changing logic automatically. Verified with a full `npm ci`, `prisma generate`, typecheck, lint, `dup:check`, and production `next build` (all 54 routes) after the restructure.
- **2026-07-13 [Phase 7 - Production Resilience]**: Hardened `getCurrentUser()` so transient Prisma/Supabase connection failures fall back to guest rendering instead of taking public pages into the global error boundary. Verified with a deliberately unavailable database, plus typecheck, lint, build, smoke, and live production health checks.
- **2026-07-13 [Phase 6 - Credential Verification]**: Replaced simulated admin certificate checks with database-backed verification, added the public `/verifikasi` portal with loading/success/error states, linked it from the admin panel and footer, and extended the smoke test to cover the new route.
- **2026-07-13 [Phase 5 - Landing Page Refinement]**: Refined the public landing page around the active royal-blue identity (`#2A6BA7`), repaired the unstyled insight cards, added an accessible FAQ section with an organization CTA, improved CTA hierarchy and focus states, and verified with typecheck, changed-file lint, production build, and the full smoke test.
- **2026-07-05 [Phase 1 - Vercel Deployment]**: Successfully configured dynamic Google OAuth callback paths (`/api/auth/google/callback` and `/api/auth/callback/google`), implemented `/tmp` SQLite mirroring for Vercel serverless, and deployed live to `profas-leadership-lms.vercel.app`.
- **2026-07-05 [Phase 2 - Autonomous Loop Initiation]**: Completed `/grill-me` architectural interrogation. Aligned on 3 priorities: Automated Assessment & Certification Engine, Modern Glassmorphism UI, and Cloud PostgreSQL Migration Readiness. Created `implementation_plan.md` and initialized `CLAUDE.md` memory.
- **2026-07-05 [Phase 3 - Autonomous Feature Execution & QA]**: Implemented Modern Glassmorphism styling across Landing Page and Dashboard (`.glass`, `.glass-card`). Integrated Interactive Quiz Engine (`/kuis/[id]` and `/api/kuis/submit`) with timer and auto-grading. Created PostgreSQL Cloud Migration Guide (`docs/MIGRATION_POSTGRESQL.md`). Performed self-debugging to fix 28 lint/type issues; achieved 100% clean typecheck, lint, and production build (`npm run build`). Ready for Vercel auto-deploy.
- **2026-07-05 [Phase 4 - Executive Interactivity & Gamification]**: Enhanced Course Player (`components/CoursePlayer.tsx`) with interactive personal lesson notes saved locally and downloadable as `.txt`, plus glassmorphism downloadable material cards. Upgraded Leaderboard (`app/peringkat/page.tsx`) with a glowing Gold/Silver/Bronze Top 3 Podium. Refined Analytics Dashboard (`app/dashboard/analitik/page.tsx`) with glassmorphism metric cards and gradient activity distribution charts. Passed 100% typecheck, lint, and production build. Automatically deployed to Vercel via GitHub push.
