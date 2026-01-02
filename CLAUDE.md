# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start dev server with Turbopack
- `npm run dev:no-turbo` - Dev server without Turbopack
- `npm run typecheck` - TypeScript type checking
- `npm run lint` / `npm run lint:fix` - ESLint

### Testing
- `npm run test` - Run Vitest in watch mode
- `npm run test:ui` - Vitest with UI
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage (80% threshold enforced)

### Build & Deploy
- `npm run build` - Production build (uses 8GB memory allocation)
- `npm run build:analyze` - Build with bundle analyzer
- `npm start` - Start production server
- `npm run clean` - Clean .next, dist, and coverage directories

## Architecture Overview

### Tech Stack
- **Next.js 15** with App Router (React Server Components, React 19, TypeScript 5.9)
- **State Management**: TanStack React Query (server state) + Zustand (UI state)
- **UI**: Tailwind CSS v4 + shadcn/ui components (Radix UI primitives)
- **Real-time**: Socket.IO Client 4.8 with automatic React Query cache invalidation
- **Testing**: Vitest + @testing-library (80% coverage threshold)

### Project Structure
```
src/
├── app/                    # Next.js App Router routes (kebab-case folders)
│   ├── (public)/          # Public routes: login, server-error, ip-blocked
│   ├── (routes)/          # Protected routes (default: require auth)
│   ├── api/               # API routes (proxied to backend service)
│   ├── dashboard/         # Dashboard pages: utama, program, efisiensi
│   ├── messages/          # Real-time messaging
│   ├── users/             # User management
│   └── settings/          # Settings pages
├── components/            # Reusable UI components
│   ├── ui/               # 60+ shadcn/ui base components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── messaging/        # Real-time messaging components
│   ├── charts/           # Recharts data visualizations
│   ├── layout/           # App shell, sidebar, navigation
│   └── providers/        # React Query, Theme providers
├── features/             # Feature-specific modules (mbg, messaging, sp2d)
├── hooks/                # 70+ custom React hooks
├── services/             # API services (MessageService, etc.)
├── stores/               # Zustand state (messaging, notification, bps-data)
├── lib/                  # Utilities and configurations
│   ├── api/              # httpClient, backendHttp (Axios instances)
│   ├── config/           # Unified app config (config.ts, query-configs.ts)
│   ├── security/         # CSRF manager, cookie managers
│   └── cache/            # Cache warming, metrics
├── shared/               # Shared utilities and types
│   ├── socket-events.ts  # Unified socket event definitions (SSOT)
│   └── rbac.ts           # Role-based access control
├── query-builders/       # SQL query builders (Where, Select, GroupBy)
└── types/                # TypeScript type definitions
```

### HTTP Client Architecture

**Two Axios instances** in `src/lib/api/httpClient.ts`:

1. **`http`** - Goes through Next.js API proxy (same-origin)
   - Base URL: `""` (empty, resolves to current origin)
   - Auto-attaches CSRF token from `csrfManager.getCSRFToken()`
   - Handles 401 with redirect to login
   - Handles 403 IP blocking with redirect to `/ip-blocked`

2. **`backendHttp`** - Direct backend communication
   - Base URL: `config.apiUrl` (absolute backend URL)
   - CSRF via cookie fallback (`XSRF-TOKEN` cookie)
   - Same error handling as `http`

**CSRF Token Management** (`src/lib/security/csrfManager.ts`):
- `getCSRFToken()` - Fetch token with cache
- `refreshToken()` - Force refresh
- `clearCache()` - Clear cached token

**API Configuration** (`src/lib/config/config.ts`):
- Client-side: Uses relative path `/api/v1` (cookies set for app origin)
- Server-side: Uses absolute URL (Docker: `http://backend:8080/api/v1`, Dev: `http://localhost:8080/api/v1`)
- Socket URL derived by removing `/api/v1` suffix

### React Query Configuration

**Query configs** in `src/lib/config/query-configs.ts`:
- `static` - 30min stale, 1hr GC (rarely changes)
- `user` - 5min stale, 15min GC (auth/user data)
- `dashboard` - 2min stale, 10min GC (analytics)
- `realtime` - 30s stale, 5min GC (messaging, live updates)
- `critical` - 1min stale, 5min GC (auth, permissions)
- `financial` - 3min stale, 15min GC (high accuracy needed)
- `search` - 1min stale, 3min GC (short-lived results)

**Query key factories** (for consistent cache invalidation):
```typescript
import { queryKeyFactories } from '@/lib/config/query-configs'

// Usage examples
queryKeyFactories.financial.mbg.quickStats()
queryKeyFactories.messaging.messages(userId, conversationId)
queryKeyFactories.user.profile()
```

### WebSocket & Real-time Integration

**Socket events** defined in `src/shared/socket-events.ts` (SSOT):
- All socket event names and types exported from `SOCKET_EVENTS`
- `MessageSendPayload`, `MessageNewPayload`, `TypingStartPayload`, etc.
- `Message`, `Conversation`, `User` data models
- `FrontendMessage` interface for optimistic updates

**Pattern**: Socket events automatically invalidate React Query caches via `queryKeyFactories`. When receiving a `message:new` event, invalidate `queryKeyFactories.messaging.messages()`.

### Authentication & Middleware

**Middleware** (`middleware.ts`) - fail-secure (protect-by-default):
- Protected routes require session validation via `/api/v1/auth/session`
- Public routes: `/login`, `/server-error`, `/ip-blocked`
- IP blocking: redirect to `/ip-blocked` with duration/reason params
- Session cookie: `sid` (HTTP-only)

**Route protection** (`src/config/routes.ts`):
- `isPublicRoute(pathname)` - Returns true for public routes
- `isProtectedRoute(pathname)` - Returns true for protected routes
- Everything is protected unless explicitly public

### State Management Pattern

**React Query** (Server State):
- Use `createQueryOptions(configType)` for consistent caching
- Example: `createQueryOptions('financial')` for financial data
- Query keys via `queryKeyFactories` for invalidation

**Zustand** (Client State):
- Active conversations (`src/stores/messaging-store.ts`)
- Typing indicators (`src/stores/typing-indicators-store.ts`)
- Notifications (`src/stores/notification-store.ts`)
- Unread badges (`src/stores/unread-badges-store.ts`)

### Code Standards

- **Components**: `PascalCase.tsx`
- **Hooks**: `useName.ts`
- **Utilities**: `camelCase.ts`
- **Route folders**: kebab-case (match URLs, e.g., `data-makrokesra`)
- **Import order**: React/Next → external libs → aliases → relative paths
- Use TypeScript strict mode
- Run `npm run lint` and `npm run typecheck` before pushing

### Testing

- Test files in `test/` with `*.test.ts|tsx` suffix
- Use user-centric queries: `getByRole`, `findByText`
- 80% coverage threshold enforced
- Add regression tests for every bug fix

### Environment Variables

```env
# Backend (defaults: localhost:8080 or backend:8080 in Docker)
NEXT_PUBLIC_BACKEND_PORT=8080
BACKEND_PORT=8080
API_URL=...
NEXT_PUBLIC_API_URL=...

# Socket
NEXT_PUBLIC_SOCKET_ORIGIN=...
NEXT_PUBLIC_SOCKET_PATH=/socket.io

# Debug
NEXT_PUBLIC_DEBUG_AUTH=true|false
NEXT_PUBLIC_DEBUG_SOCKET=true|false
```
