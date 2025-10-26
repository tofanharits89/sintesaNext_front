# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development & Building
- `npm run dev` — Start Next.js development server with Turbopack
- `npm run dev:no-turbo` — Start Next.js dev server without Turbopack
- `npm run build` — Production build (respects security headers and image config in next.config.ts)
- `npm run build:analyze` — Build with bundle analyzer enabled
- `npm run start` — Serve the production build
- `npm run clean` — Remove `.next`, `dist`, and `coverage` directories

### Code Quality
- `npm run lint` — Run ESLint (Next.js + TypeScript rules)
- `npm run lint:fix` — Run ESLint with auto-fix
- `npm run type-check` — Strict TypeScript check (no emit)

### Testing
- `npm test` — Run Vitest in watch mode
- `npm run test:run` — Run tests once (CI mode)
- `npm run test:ui` — Run Vitest with UI
- `npm run test:coverage` — Run tests with coverage report
- Coverage threshold: 80% for lines, branches, functions, and statements

### Pre-commit Checklist
Run before pushing: `npm run test:run && npm run lint && npm run type-check`

## Project Architecture

### Overview
This is a Next.js 15 (App Router) application with TypeScript, building a finance/analytics dashboard. The architecture follows Next.js 15 best practices with simplified, maintainable code patterns.

### Key Directories
- **App Router**: `src/app` — Contains routes, layouts, and server actions
- **UI Components**: `src/components` — React components including shadcn/ui
- **State & Logic**: `src/stores` (Zustand), `src/contexts`, `src/hooks`, `src/utils`
- **Data Layer**: `src/services` (API/axios), `src/types`, `src/shared`
- **API Routes**: `src/app/api` — Backend API proxy routes
- **Tests**: `test/*.test.tsx` — Vitest tests with Testing Library

### Authentication & Authorization
- **Middleware**: `middleware.ts` (root) handles authentication using cookie-based tokens
- Protected routes are defined in the middleware (e.g., `/dashboard`, `/inquiry-data`, `/users`)
- Public routes include `/login`, `/register`, `/forgot-password`, `/`
- Uses HttpOnly cookies for access/refresh tokens with security best practices
- IP blocking utility available at `@/utils/ipBlock`

### Configuration
- **Environment**: `src/lib/config/config.ts` — Unified configuration with environment-aware API/Socket URLs
- **Next.js Config**: `next.config.ts` — Comprehensive security headers, CSP, image optimization, webpack aliases
- **TypeScript**: `tsconfig.json` — Strict mode with path aliases `@/*` and `@shared/*`
- **Testing**: `vitest.config.ts` — jsdom environment with 80% coverage thresholds

### API Integration
- API calls proxied through `/api/v1/*` routes in `next.config.ts` rewrites
- Backend service name: `backend:88` (Docker) or `localhost:88` (dev)
- Configuration automatically handles Docker internal networking vs localhost
- Socket.IO integration available with auto-origin detection

### Styling & UI
- Tailwind CSS v4 with shadcn/ui component library
- Component aliases configured: `@/components`, `@/lib/utils`, `@/components/ui`
- Style: "new-york" theme in shadcn configuration
- Animations available via `@animate-ui` registry

## Environment Setup

### Required Environment Variables
- `NEXT_PUBLIC_API_URL` — API base URL (optional, has fallbacks)
- `NEXT_PUBLIC_SOCKET_ORIGIN` — Socket.IO origin (optional, auto-detected)
- `NEXT_PUBLIC_BACKEND_ORIGIN` — Backend origin (optional)
- `NODE_ENV` — `development` or `production`
- `HTTPS` — Set to `true` in production for HSTS headers

### Environment Files
- `.env.local` — Development (never commit)
- `.env.production` — Production configuration
- `.env.example` — Template for required variables
- `.env.docker.example` — Docker-specific configuration

See examples in repository. Never commit secrets.

## Security Considerations

### Security Headers
The application enforces comprehensive security via `next.config.ts`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Content Security Policy (CSP) with Next.js and Google Maps support
- Permissions Policy restricting browser features
- HSTS in production with HTTPS

### Build Behavior
- ESLint ignores errors during builds (`ignoreDuringBuilds: true` in next.config.ts)
- TypeScript errors ignored in CI (`ignoreBuildErrors: process.env.CI === 'true'`)
- Console statements removed in production (except error/warn)
- Validates changes locally with `npm run build && npm start`

### Testing Environment
- jsdom setup in `src/test-setup.ts`
- Mocked: Next.js router, IntersectionObserver, ResizeObserver, localStorage, sessionStorage
- Test utilities available via global `testUtils` helper
- Jest compatibility layer provided via `globalThis.jest`

## Common Development Patterns

### Component Structure
- React components: PascalCase files in `src/components` (e.g., `UserCard.tsx`)
- Hooks: `src/hooks`, function names start with `use` (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatCurrency.ts`, `authService.ts`)
- Prefer named exports over default exports

### Path Aliases
- Use `@/*` for src-relative imports
- Use `@shared/*` for shared utilities
- Avoid relative import chains

### API Routes
Located in `src/app/api/*`, commonly used routes:
- `/api/auth/*` — Authentication endpoints
- `/api/dashboard/*` — Dashboard data
- `/api/messaging/*` — Messaging service
- `/api/notifications/*` — Notification management
- `/api/admin/*` — Administrative functions

### Testing Structure
- Tests in `test/*.test.tsx` directory
- Naming: `feature-name.test.tsx`
- Import path aliases supported: `@/*` and `@shared/*`
- Setup: `src/test-setup.ts` with global mocks and utilities

## Key Features & Modules

### Dashboard & Analytics
- Multiple dashboard routes: `/dashboard`, `/monitor-performa`, `/data-supplier`
- Chart components: `src/components/charts`
- Real-time monitoring with Socket.IO
- Query management with saved queries in `src/app/api/saved-queries`

### Messaging System
- Real-time messaging at `/messages`
- Socket.IO integration with auto-reconnection
- Hooks: `src/hooks/messaging`, `src/hooks/messaging-rq`
- Components: `src/components/messaging`

### Data Management
- Inquiry system at `/inquiry-data`
- Provinces/KabKota endpoints: `/api/provinsi`, `/api/kabkota`
- Transfer daerah functionality
- Makan bergizi program tracking

### User Management
- User routes: `/users`, `/profile`
- RBAC testing at `/test-rbac`
- Administrative functions in `/admin` and `/settings`

## Development Tips

### Debug Routes
- `/debug-user` — Debug user authentication
- `/debug-cookies` — View cookie state
- `/test-skeletons` — Test loading states
- `/test-rbac` — Test role-based access

### Performance
- Bundle analysis: `npm run build:analyze` or `ANALYZE=true npm run build`
- Turbopack enabled by default in dev (`npm run dev`)
- Optimized package imports configured for common libraries
- Image optimization with WebP/AVIF formats

### Docker Support
- Dockerfile and Dockerfile.dev included
- Standalone output mode configured
- Internal networking: frontend connects to `backend:88` service
- Container-optimized configuration in next.config.ts

## Important Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config, security headers, webpack aliases, CSP |
| `tsconfig.json` | TypeScript config with path aliases |
| `vitest.config.ts` | Testing configuration with jsdom |
| `eslint.config.mjs` | ESLint rules (Next.js + TypeScript) |
| `components.json` | shadcn/ui configuration |
| `middleware.ts` | Authentication & route protection |
| `src/lib/config/config.ts` | Unified environment configuration |

## Related Documentation

- **AGENTS.md** — Detailed project structure and coding guidelines
- **README.md** — Project overview and setup instructions
- Environment examples in `.env.*` files
