# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack (recommended)
- `npm run dev:no-turbo` - Start development server without Turbopack
- `npm run build` - Build production version
- `npm run build:analyze` - Build with bundle analyzer
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript type checking (no emit)

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage
- `npm run test:ui` - Run tests with visual interface

### Maintenance
- `npm run clean` - Clean build artifacts, .next, dist, coverage
- `npm run install:clean` - Clean install dependencies

## Architecture Overview

### Core Technologies
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **React Query (@tanstack/react-query)** for server state management
- **Zustand** for client state management
- **Tailwind CSS** for styling
- **Radix UI** for component primitives
- **Vitest** for testing

### Authentication System
The project uses a consolidated authentication module located in `src/lib/auth/`:

- **HTTP-Only cookies** for secure token storage
- **Automatic token refresh** 5 minutes before expiry
- **Cross-tab synchronization** for consistent auth state
- **Role-based access control (RBAC)** helpers
- **Middleware-based route protection** in `middleware.ts`

**Key files:**
- `src/lib/auth/` - Complete auth module (client hooks, API client, utilities)
- `middleware.ts` - Route protection and session validation
- `src/lib/auth/utils-server.ts` - Server-safe auth utilities for middleware

### Cache Management
Unified cache system across React Query, Zustand, localStorage, and sessionStorage:

- **Centralized cache invalidation** via `src/lib/auth/cache-events.ts`
- **Automatic cache clearing** on login/logout
- **Debug tools** for development (`useCacheDebug` hook)
- **Preserved user preferences** (theme, language) across logout

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes
│   ├── (routes)/          # Protected route groups
│   ├── api/               # API routes
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   └── providers/        # React providers
├── lib/                   # Core utilities
│   ├── auth/             # Consolidated auth module
│   ├── config.ts         # Environment configuration
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
├── services/              # Business logic services
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── utils/                # Additional utilities
```

### State Management Architecture

**Server State (React Query):**
- API calls, caching, synchronization
- Query configs in `src/lib/query-configs.ts`
- Custom hooks in `src/hooks/` for data fetching

**Client State (Zustand):**
- UI state, user preferences
- Stores in `src/stores/`
- Auth state integrated with React Query

### Configuration Management
- **Single source of truth** in `src/lib/config.ts`
- **Environment-aware** API URLs (Docker vs localhost)
- **Type-safe configuration** with helper functions

### Real-time Features
- **Socket.IO integration** for real-time messaging
- **Unified socket client** in `src/lib/socket-client.ts`
- **Cross-tab sync** for auth events

## Development Patterns

### Import Patterns
- Use `@/lib/auth` for client-side auth functionality
- Use `@/lib/auth/utils-server` for middleware/API routes
- Import from `src/lib/utils.ts` for utility functions
- Use absolute imports with `@/` prefix

### Component Structure
- Follow shadcn/ui patterns in `src/components/ui/`
- Use Radix UI primitives with custom styling
- Implement proper error boundaries
- Use React Query hooks for data fetching

### Error Handling
- Error boundaries wrap major components
- Unified error handling in `src/utils/errorHandling.ts`
- Retry logic for failed requests
- Proper TypeScript error types

### Performance Optimization
- Route preloading via `RoutePreloader` component
- Chunk preloading for better perceived performance
- Optimistic updates where appropriate
- Efficient cache invalidation strategies

## Important Notes

### Environment Configuration
- Uses `NEXT_PUBLIC_API_URL` for client-side API URL
- Server-side uses `API_URL` or falls back to public URL
- Debug mode enabled with `NEXT_PUBLIC_DEBUG_AUTH=true`

### Security Considerations
- All authentication uses HTTP-only cookies
- CSRF protection built-in
- IP blocking support in middleware
- Proper session validation on protected routes

### Testing Strategy
- Vitest for unit testing
- React Testing Library for component testing
- Test setup in `src/test-setup.ts`
- Coverage reporting available

### Common Issues
- **Middleware auth failures:** Check token validation in `middleware.ts`
- **Cache invalidation:** Use unified cache system in `src/lib/auth/cache-events.ts`
- **Socket connection issues:** Verify socket URL configuration in `src/lib/config.ts`
- **Build issues:** Run `npm run type-check` to verify TypeScript types