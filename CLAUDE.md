# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**sintesaNEXT** is a Next.js 15 + React 19 Indonesian finance dashboard application. It's a complex enterprise application with multiple modules including MBG (Makan Bergizi), EPA, transfer daerah, user management, reporting, and messaging.

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS v4 (style: "new-york"), shadcn/ui
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest with jsdom
- **State Management**: Zustand, TanStack Query
- **Real-time**: socket.io
- **Styling**: Tailwind CSS v4, Framer Motion (motion)
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation

## Common Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run dev:no-turbo     # Start dev server without Turbopack

# Building
npm run build            # Production build (with memory optimization)
npm run build:analyze    # Build with bundle analyzer
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run typecheck        # TypeScript type checking

# Testing
npm test                 # Run tests in watch mode
npm run test:ui          # Run tests with Vitest UI
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage report

# Utilities
npm run clean            # Clean build artifacts (.next, dist, coverage)
npm run install:clean    # Clean install dependencies
npm run analyze:bundle   # Analyze bundle size
```

## Project Structure

### Directory Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (v1, auth, dashboard, etc.)
│   ├── (public)/          # Public routes
│   ├── dashboard/         # Dashboard module (utama, program)
│   ├── makan-bergizi/     # MBG module (dashboard, kertas-kerja)
│   ├── epa/               # EPA module
│   ├── laporan/           # Reports (weekly, monthly)
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components (AppShell, etc.)
│   ├── messaging/        # Messaging system components
│   ├── dashboard/        # Dashboard-specific components
│   └── ...
├── features/             # Feature-based modules
│   ├── mbg/              # MBG feature (types, hooks, api, components)
│   └── messaging/        # Messaging feature
├── lib/                  # Core libraries
│   ├── auth/             # Authentication logic
│   ├── config/           # App configuration
│   ├── stores/           # Zustand stores
│   ├── utils/            # Utility functions
│   └── ui/               # UI utilities (error boundaries, etc.)
├── hooks/                # Custom React hooks
├── services/             # Business logic services
│   ├── FilterDataService.ts
│   ├── MessageService.ts
│   └── ...
├── stores/               # Global state stores
├── contexts/             # React contexts
└── utils/                # Helper utilities
```

### Path Aliases

- `@/*` → `./src/*`
- `@shared/*` → `./src/shared/*`

## Architecture Patterns

### 1. App Router Structure
- Uses Next.js 15 App Router with `layout.tsx` and `page.tsx` files
- Server-side components by default with client components marked with `"use client"`
- Route groups using parentheses: `(public)`, `(routes)`

### 2. Feature-Based Organization
- **Features** directory for major modules (MBG, messaging)
- Each feature contains: types, hooks, api, components
- Shared components in `components/` organized by domain

### 3. State Management
- **Zustand** for global client state (users, UI state)
- **TanStack Query** for server state (data fetching, caching)
- Custom hooks in `hooks/` for reusable logic

### 4. Authentication
- Session-based authentication with HTTP-only cookies (`sid`)
- Middleware at `middleware.ts` for route protection
- Protected routes: `/dashboard`, `/inquiry-data`, `/admin`, `/profile`, `/users`, `/settings`, `/messages`, `/makan-bergizi`, `/data-supplier`, `/epa`, etc.
- Public routes: `/login`, `/register`, `/forgot-password`, `/unauthorized`, `/ip-blocked`

### 5. API Layer
- API routes under `src/app/api/`
- Versioned API: `/api/v1/`
- Unified authentication endpoint: `/api/v1/auth/session`
- Multiple modules: auth, dashboard, epa, inquiry-data, messaging, notifications, satker, supplier-analytics, transfer-daerah, users, whatsapp

### 6. UI Components
- shadcn/ui component library with "new-york" style
- Custom components in `components/ui/`
- Radix UI primitives for accessibility
- Tailwind CSS v4 for styling

## Key Modules

### Dashboard Module (`/dashboard/`)
- **utama**: Main dashboard view
- **program**: Program management
- Server-side layout in `src/app/dashboard/layout.tsx`

### MBG (Makan Bergizi) Module (`/makan-bergizi/`)
- **dashboard**: MBG dashboard
- **kertas-kerja**: Working papers
- Feature implementation in `src/features/mbg/`

### Reports (`/laporan/`)
- **weekly-report**: Weekly reports
- **monthly-report**: Monthly reports

### Other Modules
- **epa/**: EPA module
- **inquiry-data/**: Data inquiry
- **transfer-daerah/**: Regional transfers
- **satker/**: Work units
- **notifications/**: Notifications system
- **messages/**: Messaging system
- **users/**: User management
- **settings/pengaturan**: Application settings

## Development Notes

### Authentication Flow
1. Users redirected from `/` to `/login` if not authenticated
2. Middleware validates session cookies before protected routes
3. Server-side session validation via `/api/v1/auth/session`
4. Session cookies managed via HTTP-only cookies

### Error Handling
- Global error boundary in `lib/ui/error-boundary.ts`
- Component-level error boundaries using `ComponentErrorBoundary`
- Custom error page at `src/app/error.tsx`

### Testing
- Vitest configured with jsdom environment
- Test setup in `src/test-setup.ts`
- Coverage thresholds: 80% for branches, functions, lines, statements
- Tests exclude: `src/hooks/__tests__/use-saved-queries.test.ts`

### Performance Optimizations
- Next.js Turbopack for dev builds
- Bundle analysis support: `npm run analyze:bundle`
- Memory-optimized builds: `node --max-old-space-size=12288`
- Image optimization configured (WebP, AVIF)
- Console removal in production (except error, warn)

### Security
- Comprehensive security headers in `next.config.ts`
- IP blocking mechanism at `src/utils/ipBlock.ts`
- CSRF protection routes at `/api/csrf-token/`
- XSS protection, clickjacking prevention, MIME sniffing protection

### Configuration
- TypeScript: Strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Tailwind CSS v4 with CSS variables
- ESLint with Next.js configuration
- Environment-based API URLs and configurations

### Real-time Features
- Socket.io integration for real-time updates
- WebSocket connections managed via hooks
- Real-time messaging system

## Important Files

- `src/app/layout.tsx`: Root layout with providers (QueryProvider, ThemeProvider, PageProvider)
- `middleware.ts`: Authentication and route protection
- `src/app/page.tsx`: Home page with auth redirect logic
- `components.json`: shadcn/ui configuration
- `next.config.ts`: Next.js configuration with security headers
- `vitest.config.ts`: Testing configuration
- `tsconfig.json`: TypeScript configuration

## Working with This Codebase

1. **Adding a new feature**: Create in `src/features/[feature-name]/` and add routes in `src/app/[feature-name]/`
2. **Creating API endpoints**: Add to `src/app/api/[version]/[module]/`
3. **Adding UI components**: Use shadcn/ui components from `components/ui/`
4. **State management**: Use Zustand for client state, TanStack Query for server state
5. **Testing**: Write tests with Vitest, follow existing test patterns
6. **Styling**: Use Tailwind CSS v4 classes, components use CSS variables for theming

## Development Tips

- Development mode supports optimistic authentication (configurable)
- Use `npm run dev:no-turbo` if Turbopack causes issues
- Run `npm run typecheck` before committing
- Use `npm run lint:fix` to auto-fix linting issues
- Check bundle size with `npm run analyze:bundle`
- Clean build artifacts with `npm run clean` when troubleshooting
