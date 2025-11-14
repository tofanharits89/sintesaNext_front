# Repository Guidelines

## Project Structure & Module Organization
`src/app/` holds the Next 15 routes/layouts while `src/components/`, `src/contexts/`, and `src/features/` group reusable UI, context providers, and domain bundles. Helpers live under `src/lib/`, shared styles and tokens under `src/styles/`, and `src/hooks/` follows the `useX` naming pattern. Persistent data builders/extensions appear in `src/query-builders/`, `src/services/`, and `src/stores/`. The `test/` directory mirrors important flows (e.g., `test/auth-*.test.tsx`) while `public/` holds static assets and `scripts/` automates installs or bundle analysis.

## Build, Test, and Development Commands
- `npm run dev` — starts Next with Turbopack for local hacking. Use `npm run dev:no-turbo` when Turbopack contentions arise.
- `npm run build` / `npm run start` — run the optimized production build and serve it with `next start`.
- `npm run lint` / `npm run lint:fix` — enforce the `next/core-web-vitals` + `next/typescript` ESLint rules and auto-fix.
- `npm run test` / `npm run test:run` / `npm run test:coverage` — Vitest runs in jsdom; coverage obeys the 80% global threshold defined in `vitest.config.ts`.
- `npm run typecheck` — ensures `tsc --noEmit` passes before merges.
- `npm run clean` / `npm run install:clean` / `npm run analyze:bundle` — housekeeping commands in `package.json`.

## Coding Style & Naming Conventions
Adhere to Next/TypeScript defaults (2-space indentation, semicolon-optional, ESM modules) since ESLint extends `next/core-web-vitals` + `next/typescript`. React components stay PascalCase, hooks stay `useCamelCase`, and utility files favor camelCase exports. Tailwind (v4) classes live in component markup; keep styling atomic and use `styles/` tokens to share them. Keep data/feature folders descriptive (e.g., `features/watchlist`), and `test` artifacts always use the `.test.tsx`/`.test.ts` suffix.

## Testing Guidelines
Vitest is the single framework. Run `npm run test` locally, and re-run with `npm run test:coverage` to inspect the `coverage/html` report. Tests reference `src/test-setup.ts` for global helpers and rely on the `test/` directory for flow coverage. Files should be named after the behavior they cover (`logout-loading-on-login.test.tsx`, etc.) so reviewers can align failures with user journeys.

## Commit & Pull Request Guidelines
Commit messages follow short, descriptive phrases (e.g., `fix the data-bps page`, `perbaikan`). Keep them present-tense/imperative and reference the area you touched. PRs lack a template, so always include a concise summary, a list of tests run, linked issues or tickets, and screenshots for UI changes. Run lint/test commands and mention their results in the PR body before requesting reviews.
