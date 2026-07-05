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
- **Lint**: `npm run lint`
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

---

## 🔄 Self-Improvement & Progress Log
- **2026-07-05 [Phase 1 - Vercel Deployment]**: Successfully configured dynamic Google OAuth callback paths (`/api/auth/google/callback` and `/api/auth/callback/google`), implemented `/tmp` SQLite mirroring for Vercel serverless, and deployed live to `profas-leadership-lms.vercel.app`.
- **2026-07-05 [Phase 2 - Autonomous Loop Initiation]**: Completed `/grill-me` architectural interrogation. Aligned on 3 priorities: Automated Assessment & Certification Engine, Modern Glassmorphism UI, and Cloud PostgreSQL Migration Readiness. Created `implementation_plan.md` and initialized `CLAUDE.md` memory.
- **2026-07-05 [Phase 3 - Autonomous Feature Execution & QA]**: Implemented Modern Glassmorphism styling across Landing Page and Dashboard (`.glass`, `.glass-card`). Integrated Interactive Quiz Engine (`/kuis/[id]` and `/api/kuis/submit`) with timer and auto-grading. Created PostgreSQL Cloud Migration Guide (`docs/MIGRATION_POSTGRESQL.md`). Performed self-debugging to fix 28 lint/type issues; achieved 100% clean typecheck, lint, and production build (`npm run build`). Ready for Vercel auto-deploy.
- **2026-07-05 [Phase 4 - Executive Interactivity & Gamification]**: Enhanced Course Player (`components/CoursePlayer.tsx`) with interactive personal lesson notes saved locally and downloadable as `.txt`, plus glassmorphism downloadable material cards. Upgraded Leaderboard (`app/peringkat/page.tsx`) with a glowing Gold/Silver/Bronze Top 3 Podium. Refined Analytics Dashboard (`app/dashboard/analitik/page.tsx`) with glassmorphism metric cards and gradient activity distribution charts. Passed 100% typecheck, lint, and production build. Automatically deployed to Vercel via GitHub push.
