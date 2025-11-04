# Repository Guidelines

## Project Structure & Module Organization
- Next.js routing lives in `src/app`, with feature routes grouped under folders like `dashboard` and `auth`.
- Reusable UI sits in `src/components`; domain services, stores, and API hooks are split across `src/features`, `src/services`, and `src/stores`.
- Shared helpers and types stay in `src/lib`, `src/utils`, and `src/types`, while Tailwind tokens live in `src/styles`.
- Vitest specs mirror the app layout inside `test/`, and static assets ship from `public/`.
- Utility scripts (cleanup, bundle analysis, fresh installs) live in `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` starts the dev server with Turbopack; use `npm run dev:no-turbo` if you hit hot-reload edge cases.
- `npm run build` generates the production bundle, allocating extra memory for large pages; follow with `npm run start` to preview it.
- `npm run lint` (or `npm run lint:fix`) enforces the ESLint rules configured in `eslint.config.mjs`.
- `npm run test` runs the Vitest suite in watch mode; add `:coverage` for a full report or `:run` for CI-friendly execution.
- `npm run typecheck` ensures the TypeScript surface matches our contracts; `npm run clean` removes `.next`, `dist`, and `coverage`.

## Coding Style & Naming Conventions
- Use TypeScript with 2-space indentation and the ESLint defaults; prefer named exports from `src/components` and `src/utils`.
- Follow React norms: PascalCase components, camelCase hooks and utilities, and colocate styles with their feature directory.
- Default to Tailwind utilities; extend shared tokens in `src/styles` before adding one-off class names.

## Testing Guidelines
- Write specs with Vitest and React Testing Library; mimic existing `*.test.tsx` patterns in `test/` and keep fixtures lightweight.
- Cover new hooks or stores with focused unit tests; components with behaviour should exercise both optimistic and error flows.
- For critical flows, add coverage assertions via `npm run test:coverage` and ensure thresholds stay above existing baselines.

## Commit & Pull Request Guidelines
- Mirror `git log`: short, imperative, lowercase commits (e.g., `fix type errors`).
- Each PR needs a summary, linked issue, test notes, and screenshots for UI shifts; call out new env vars or script updates explicitly.

## Environment & Configuration
- Store secrets in `.env.local`; avoid checking them in and document any new keys in the PR description.
- Run `npm run install:clean` after dependency changes to refresh local installs, and regenerate bundle insights with `npm run analyze:bundle` when touching performance-sensitive code.
