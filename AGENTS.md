# Repository Guidelines

## Project Structure & Module Organization
- App Router: `src/app` (routes, layouts, server actions).
- UI: `src/components`, styles in `src/styles`, icons/assets in `public/`.
- State/logic: `src/stores`, `src/contexts`, `src/hooks`, `src/utils`.
- Data/access: `src/services` (API/axios), shared types in `src/types` and `src/shared`.
- Config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`.
- Tests: `test/*.test.tsx`. Import aliases: `@/*` and `@shared/*`.

## Build, Test, and Development Commands
- `npm run dev` — Start Next.js with Turbopack.
- `npm run build` — Production build; respect security headers and image config.
- `npm start` — Serve the built app.
- `npm run lint` / `npm run lint:fix` — ESLint (Next + TS rules).
- `npm run type-check` — Strict TypeScript check (no emit).
- `npm test` — Vitest in watch mode; `npm run test:run` CI mode; `npm run test:coverage` coverage.
- `npm run clean` — Remove `.next`, `dist`, `coverage`.

## Coding Style & Naming Conventions
- TypeScript strict; 2-space indent; no implicit `any`.
- React components: PascalCase files in `src/components` (e.g., `UserCard.tsx`).
- Hooks: `src/hooks`, file and function names start with `use` (e.g., `useAuth.ts`).
- Utilities/services: camelCase (e.g., `formatCurrency.ts`, `authService.ts`).
- Prefer named exports; use path aliases `@/…` and `@shared/…` instead of relative chains.
- Tailwind CSS v4 is enabled; keep classes readable and grouped by role.

## Testing Guidelines
- Framework: Vitest + Testing Library (`jsdom`). Setup: `src/test-setup.ts`.
- Location: `test/*.test.tsx`; name files `feature-name.test.tsx`.
- Coverage thresholds are 80% (lines, branches, functions, statements).
- Run before pushing: `npm run test:run && npm run lint && npm run type-check`.

## Commit & Pull Request Guidelines
- Use imperative, concise messages. Conventional style preferred: `feat(auth): add OTP flow` or `fix(login): handle redirect`.
- PRs must include: summary, screenshots for UI, reproduction/verification steps, linked issue, and risk/rollback notes.
- Green checks required: lint, type-check, tests, and `build`.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` for dev; `.env.production` for deploy (see examples in repo).
- Security headers and CSP are enforced in `next.config.ts`. Validate changes locally with `npm run build && npm start`.
- Keep network logic in `src/services`; avoid calling APIs directly in components.
