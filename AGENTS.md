# Repository Guidelines

## Project Structure
- `src/app`: Next.js App Router routes (folders stay kebab-case to match URLs), global layout in `layout.tsx`, shared styles in `globals.css`.
- `src/components`: Reusable UI building blocks (largely shadcn/Radix based).
- `src/features`, `src/services`, `src/stores`: Feature logic, API clients, and Zustand state.
- `src/utils`, `src/hooks`, `src/shared`: Cross-cutting helpers and hooks.
- `test`: Vitest + Testing Library suites mirroring app areas; setup in `src/test-setup.ts`.
- `public`: Static assets (favicons, images); `scripts/` holds maintenance utilities (e.g., install-clean).

## Build, Run, and Tooling
- Start dev (Turbopack): `npm run dev`  | non-Turbopack: `npm run dev:no-turbo`
- Type-check: `npm run typecheck`
- Lint: `npm run lint`  | auto-fix: `npm run lint:fix`
- Test: `npm run test` (watch UI: `npm run test:ui`; coverage: `npm run test:coverage`)
- Production build: `npm run build`; preview server: `npm start`
- Clean artifacts: `npm run clean`
Use Node 18+ and npm (package-lock is authoritative).

## Coding Style
- Language: TypeScript + React 19, Next.js 15 App Router.
- Formatting: follow ESLint (extends `eslint-config-next`); run lint before pushing. Tailwind v4 utilities go in JSX class lists; avoid inline styles unless necessary.
- Components/hook patterns: prefer function components; extract state to Zustand stores when shared; keep side effects inside `useEffect`/`useQuery`.
- Keep import order logical: react/next -> external libs -> aliases -> relative paths.

## Naming & Files
- Components are `PascalCase.tsx`; hooks use `useName.ts`; utilities `camelCase.ts`.
- Route folders are kebab-case to align with URLs (e.g., `data-makrokesra`).
- Tests colocate in `test/` with `*.test.ts|tsx` suffix; snapshots discouraged.

## Testing Expectations
- Use Vitest + @testing-library for UI interactions; prefer user-centric queries (`getByRole`, `findByText`).
- Cover key flows: auth, dashboard widgets, messaging, downloads. Aim for meaningful assertions over snapshot counts; add regression tests for every bug fix.
- Keep test data minimal; share fixtures via `test/utils` when reused.

## Commit & PR Guidelines
- Commit messages: short, imperative phrases (pattern seen in history: “fix messaging page UI”, “move whatsapp modal…”). Keep scope-focused.
- PRs should include: goal/summary, linked issue or ticket, testing notes (commands run), and screenshots/GIFs for UI changes.
- Ensure lint, typecheck, and `npm run test` pass before requesting review.

## Security & Config
- Do not commit secrets; `.env*` stays local. If new env keys are needed, document them in `README` or the PR description.
- Middleware-based auth lives in `middleware.ts`; avoid bypassing it in new routes.
