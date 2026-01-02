# Repository Guidelines

## Project Structure & Module Organization

- `src/app/` hosts the Next.js App Router; route folders use kebab-case and include public/protected route groups.
- UI lives in `src/components/` (notably `ui/`, `auth/`, `dashboard/`, `messaging/`, `charts/`, `layout/`, `providers/`).
- Feature logic is in `src/features/`, with shared utilities in `src/lib/` (api/config/security), `src/shared/`, `src/hooks/`, `src/services/`, `src/stores/`, `src/types/`, and `src/utils/`.
- Tests live in `test/` and mirror app/component structure; shared setup is `src/test-setup.ts`.
- Static assets are in `public/`; scripts are in `scripts/`; edge auth is in `middleware.ts`.

## Build, Test, and Development Commands

- `npm run dev` / `npm run dev:no-turbo`: start the local dev server (Turbopack on/off).
- `npm run build` / `npm run start`: production build and serve.
- `npm run lint` / `npm run lint:fix`: lint with Next.js ESLint rules.
- `npm run typecheck`: TypeScript type checking.
- `npm run test`, `test:run`, `test:ui`, `test:coverage`: Vitest watch, single-run, UI, and coverage modes.
- `npm run build:analyze` and `npm run clean`: bundle analysis and cleanup.

## Coding Style & Naming Conventions

- TypeScript is strict; follow existing patterns and the Next.js ESLint config.
- Naming: components `PascalCase.tsx`, hooks `useName.ts`, utilities `camelCase.ts`; route folders use kebab-case.
- Import order: React/Next -> external libs -> alias (`@/`) -> relative paths.
- Format code to match nearby files; lint before pushing.

## Testing Guidelines

- Frameworks: Vitest + Testing Library with `jsdom`.
- File naming: `*.test.ts` / `*.test.tsx` under `test/`.
- Coverage: global 80% thresholds (branches/functions/lines/statements).
- Add regression tests for bug fixes; prefer user-facing queries (`getByRole`, `findByText`).

## Commit & Pull Request Guidelines

- Commit messages are short, lowercase, and imperative (e.g., `fix csrf issues in messaging`, `refactor rag chat widget`, `polish rag chat UI`).
- PRs should include: summary, test commands run (or reason not run), linked issue/ticket, and screenshots for UI changes.
- Call out config or env changes explicitly.

## Security & Configuration Tips

- Use `.env.local`/`.env.production` for secrets; never commit real credentials.
- Backend and socket settings are driven by env vars (see `.env.*` files and `src/lib/config`).

## Agent Notes

- For deeper architectural context, read `CLAUDE.md` before large refactors.
