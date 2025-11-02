# Repository Guidelines

## Project Structure & Module Organization
- `src/app` hosts App Router pages, server actions, and route handlers.
- `src/components`, `src/features`, and `src/shared` contain reusable UI and domain flows; defer to `src/patterns` for composable layout primitives.
- Cross-cutting logic lives in `src/lib`, `src/utils`, `src/hooks`, and `src/services`, with API helpers in `src/query-builders`.
- State stores sit in `src/contexts` and `src/stores`, while design tokens and Tailwind layers are in `src/styles`.
- Tests mirror this structure inside `test`, and global test setup resides in `src/test-setup.ts`.
- Static assets belong in `public/`, and maintenance scripts are kept under `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` enables Turbopack development; use `npm run dev:no-turbo` if classic webpack debugging is required.
- `npm run build` compiles a production bundle with relaxed memory limits; `npm run start` serves the built app from `.next`.
- `npm run lint` validates style rules, while `npm run lint:fix` applies autofixes.
- `npm run type-check` runs project-wide TypeScript validation.
- `npm run test`, `npm run test:run`, and `npm run test:coverage` run Vitest in watch, CI, and coverage modes respectively.
- `npm run clean` purges build artifacts, and `npm run analyze:bundle` inspects bundle composition.

## Coding Style & Naming Conventions
This codebase is TypeScript-first; prefer `tsx` modules with colocated types. Maintain the existing two-space indentation and rely on ESLint (`eslint.config.mjs`) rather than manual formatting. Components, contexts, and stores export PascalCase identifiers (e.g., `DashboardShell`), hooks follow the `useSomething` camelCase pattern, utilities stay camelCase, and shared constants use UPPER_SNAKE_CASE. Co-locate feature-specific assets under their feature folder, and keep imports sorted according to linting rules.

## Testing Guidelines
Vitest with React Testing Library underpins unit and integration coverage. Place specs beside their target directory within `test` using `*.test.ts` or `*.test.tsx` naming, referencing `src/test-setup.ts` for shared mocks. Cover auth guards, data-fetching edges, and UI regression points before submitting work. Include relevant `npm run test:run` or `npm run test:coverage` output in your PR when the change alters runtime behaviour.

## Commit & Pull Request Guidelines
History favors concise, imperative commits (e.g., `fix csrf issue`), so continue that voice while referencing tickets when available. PRs should summarize the change, call out impacted routes or services, and link issues. Attach screenshots or screen recordings for UI-facing updates, and document new environment variables or config toggles. Confirm `lint`, `type-check`, and targeted tests before requesting review, noting any remaining risks or follow-ups in the description.
