# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
```bash
# Start development server with Turbopack (default)
npm run dev

# Start without Turbopack (useful for debugging)
npm run dev:no-turbo

# Clean build artifacts
npm run clean
```

### Building & Deployment
```bash
# Production build (requires 8GB memory)
npm run build

# Build with bundle analyzer
npm run build:analyze

# Start production server
npm run start
```

### Code Quality
```bash
# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

### Testing
```bash
# Run tests in watch mode
npm run test

# Run tests in UI mode
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

### Maintenance
```bash
# Clean install dependencies
npm run install:clean

# Analyze bundle size
npm run analyze:bundle
```

## Tech Stack

- **Framework:** Next.js 15.5.6 with App Router
- **Language:** TypeScript (strict mode enabled)
- **UI:** React 19.2.0 + Tailwind CSS 4.1.15
- **Components:** Radix UI primitives
- **State Management:** TanStack Query + Zustand
- **Testing:** Vitest + Testing Library + jsdom
- **Real-time:** Socket.io client
- **PDF Viewing:** react-pdf + pdfjs-dist
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation

## Project Structure

### Key Directories

- **src/app/** - Next.js App Router pages and API routes
  - **src/app/api/** - Backend API routes proxying to external services
  - Feature-based routing: `(public)`, `(routes)`, `dashboard/`, `inquiry-data/`, `epa/`, `transfer-daerah/`, etc.

- **src/components/** - Reusable UI components
  - **ui/** - Base UI components (buttons, inputs, modals, etc.)
  - Feature-based directories: `auth/`, `dashboard/`, `charts/`, `messaging/`, `monitoring/`, etc.

- **src/hooks/** - Custom React hooks
  - Specialized directories: `dashboard/`, `inquiry-data/`, `messaging/`, `monitoring/`, etc.

- **src/lib/** - Core utilities and services
  - **api/** - HTTP client and API utilities
  - **auth/** - Authentication logic
  - **cache/** - Caching layer
  - **config/** - Configuration management
  - **security/** - Security utilities (CSRF, RBAC)
  - **utils/** - General utilities

- **src/utils/** - Business logic utilities
  - **formatters/** - Data formatting helpers
  - **dashboard/** - Dashboard-specific utilities

### Configuration Files

- **next.config.ts** - Next.js configuration with security headers, CSP, API proxy, and bundle analysis
- **tsconfig.json** - TypeScript configuration with strict mode and path aliases
- **vitest.config.ts** - Vitest configuration for testing with jsdom environment
- **eslint.config.mjs** - ESLint configuration (Next.js core web vitals + TypeScript)

## Architecture Overview

This is a financial dashboard application with multiple specialized modules:

### Core Features

1. **Authentication & Authorization**
   - HTTP-only cookie-based authentication
   - Server-side JWT validation
   - Role-based access control (super_admin, co_admin, kantor_pusat, kanwil_djpb, kppn, lainnya)
   - User role determines access to different modules

2. **Dashboard Module** (`src/app/dashboard/`)
   - Main dashboard with financial analytics
   - Program tracking and visualizations
   - Quick stats and charts

3. **Inquiry Data** (`src/app/inquiry-data/`)
   - Data query builder with dynamic filters
   - Multiple report types: belanja, kontrak, penerimaan-pnbp, up-tup, tematik, rkakl-detail
   - Saved queries functionality
   - SQL query viewing
   - Export capabilities

4. **EPA Module** (`src/app/epa/`)
   - Performance evaluation and achievement tracking
   - Multiple tabs for different data views
   - Summary and detailed reporting

5. **Transfer Daerah** (`src/app/transfer-daerah/`)
   - Regional transfer data management
   - DAU (Dana Alokasi Umum) tracking
   - Projection and projection of TKDs
   - Report management and PDF viewing

6. **Messaging System** (`src/app/messages/`)
   - Real-time chat using Socket.io
   - Message persistence
   - Unread message tracking

7. **Data Supplier** (`src/app/data-supplier/`)
   - Supplier analytics and dashboards
   - Anomaly detection
   - Clustering and concentration analysis
   - Network visualization

8. **Makan Bergizi** (`src/app/makan-bergizi/`)
   - Nutrition program tracking
   - Worksheet management
   - Commodity price tracking

### Key Architectural Patterns

- **API Proxy Pattern:** All API calls go through `/api/v1/*` which proxies to backend service (default: `http://backend:88`)
- **Server-Side Auth:** Authentication validation happens on the server; no client-side cookie access
- **Error Boundaries:** Component-level error boundaries at layout level for graceful error handling
- **Suspense Boundaries:** Lazy loading and streaming implemented throughout
- **Query Layer:** TanStack Query for server state management with caching
- **Performance Optimization:** Font preloading, chunk preloading, route preloading

## Development Notes

### Important Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL                    # API base URL
NEXT_PUBLIC_USE_ABSOLUTE_API=false     # Use relative paths in client
NEXT_PUBLIC_BACKEND_ORIGIN             # Backend origin for server-side
NEXT_PUBLIC_SOCKET_ORIGIN              # Socket.IO server origin

# Backend Configuration
NEXT_PUBLIC_BACKEND_PORT=88            # Backend port (dev)
API_URL                                # Server-side API URL

# Security & Debug
NEXT_PUBLIC_DEBUG_AUTH=false           # Enable auth debugging
HTTPS=true                             # Enable HTTPS headers
```

### Backend Integration

- **API URL Resolution:** Dynamic based on environment
  - Client: Relative path `/api/v1` (cookies work automatically)
  - Server: Absolute URL to `backend:88` (Docker) or `localhost:88` (dev)
- **Socket.io:** Connects to backend on port 88, path `/socket.io`
- **Proxy Configuration:** `next.config.ts` rewrites `/api/v1/*` to backend

### Security Configuration

The application implements comprehensive security headers:
- X-Frame-Options, X-Content-Type-Options
- Referrer-Policy, X-XSS-Protection
- Permissions Policy (restrict camera, microphone, geolocation, etc.)
- HSTS (production only with HTTPS)
- Content Security Policy (CSP) with Google Maps API whitelisting
- Console.log removal in production (except error/warn)

### Testing Strategy

- **Test Environment:** jsdom with React Testing Library
- **Coverage Threshold:** 80% for branches, functions, lines, statements
- **Test Structure:** Co-located tests in `__tests__/` directories
- **Setup:** Global test setup in `src/test-setup.ts`

### Bundle Optimization

- **Package Optimization:** Automatic optimization for Radix UI, Lucide, date-fns, Recharts, TanStack Query, Socket.io-client
- **Bundle Analysis:** `npm run build:analyze` generates static HTML reports
- **Turbopack:** Enabled by default in dev mode

### Common Development Patterns

1. **API Routes:** All in `src/app/api/` with dynamic routing support
2. **Error Handling:** Use `ErrorBoundary` wrapper components
3. **State Management:** TanStack Query for server state, Zustand for client state
4. **Type Safety:** Strict TypeScript with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
5. **Performance:** Use `RoutePreloader` for route prefetching, `chunk-preloader` for idle loading

### Deployment

- **Output:** Standalone mode for Docker deployment
- **Build Memory:** Requires ~8GB for production build
- **Deployment Architecture:** Frontend + Backend + Nginx reverse proxy

## Helpful Aliases

```typescript
@/*              // src/*
@shared/*        // src/shared/*
```

## Key Files to Know

- `src/app/layout.tsx` - Root layout with providers and error boundaries
- `src/lib/config/config.ts` - Centralized configuration and API URL resolution
- `src/lib/auth/client.ts` - Authentication client with HTTP-only cookies
- `src/lib/api/httpClient.ts` - HTTP client with interceptors
- `src/components/providers/query-provider.tsx` - TanStack Query provider
- `src/hooks/dashboard/use-dashboard-data.ts` - Dashboard data fetching
- `src/utils/performance-monitor.ts` - Performance monitoring utilities
