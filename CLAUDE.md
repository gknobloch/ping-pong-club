# Ping-Pong Club — Claude Code Project Guide

## Project overview
Mobile-friendly web app for managing table tennis club players, teams, availability, and match scheduling. French-language UI.

## Tech stack
- **Frontend:** React 18 + TypeScript 5.6 + Vite
- **Styling:** Tailwind CSS 3.4
- **State:** React Context (AuthContext, MockDataContext)
- **Routing:** React Router 6
- **Unit tests:** Vitest + React Testing Library (happy-dom)
- **E2E tests:** Playwright (Chromium only)
- **CI:** GitHub Actions (build, lint, unit tests, E2E on PR/push to main)

## Key commands
- `npm run dev` — Start dev server (http://localhost:5173)
- `npm run build` — TypeScript check + Vite build
- `npm run lint` — ESLint
- `npm run test:run` — Unit tests (single run)
- `npm run test:e2e` — E2E tests (auto-starts dev server)
- `npm run test:coverage` — Unit tests with coverage

## Project structure
- `src/pages/` — Page components
- `src/components/` — Reusable components (AppShell, ClubDetailView)
- `src/contexts/` — React contexts (Auth, MockData)
- `src/mock/data.ts` — In-memory mock data store
- `src/types/index.ts` — All TypeScript interfaces and enums
- `src/lib/` — Utilities (round-robin algorithm)
- `e2e/` — Playwright E2E tests
- `docs/SPEC.md` — Business specification
- `docs/IMPLEMENTATION_PLAN.md` — Phased roadmap with GitHub issues

## Path alias
`@` maps to `src/` (configured in both vite.config.ts and tsconfig.json)

## Workflow rules
For any new feature or substantial change:
1. **Check for an existing GitHub issue** — search open/recently closed issues first
2. **Create an issue if none exists** — use it as the single tracking place
3. **Branch from issue** — e.g. `23-add-unit-and-e2e-tests`
4. **Never push directly to main** — all changes go through a PR from a feature branch
5. **Clean up after merge** — switch to main, pull, delete local and remote feature branches

Summary: Issue first → branch → implement → PR → merge → clean up branches.

## Conventions
- UI text must be in French
- Code comments and technical docs: English preferred
- All new features should include unit tests; user-facing flows should have E2E tests
