# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Indo Finance Dashboard** - a Next.js 15 financial management system for Indonesian government entities. It provides dashboard functionality for monitoring financial data, supplier information, and organizational workflows with role-based access control.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack (recommended)
- `npm run dev:no-turbo` - Start development server without Turbopack
- `npm run build` - Production build with memory optimization (12GB limit)
- `npm run build:analyze` - Build with bundle analyzer
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run typecheck` - TypeScript type checking

### Testing
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Generate coverage report (80% thresholds)

### Utilities
- `npm run clean` - Clean build artifacts (.next, dist, coverage)
- `npm run install:clean` - Clean install dependencies
- `npm run analyze:bundle` - Analyze bundle size

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 19.2.0 with Radix UI components
- **Styling**: Tailwind CSS 4.1.15 with shadcn/ui
- **State Management**: Zustand + TanStack Query (React Query)
- **HTTP Client**: Axios with interceptors
- **Testing**: Vitest with React Testing Library
- **Real-time**: Socket.IO client

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public pages (login, server-error, etc.)
│   ├── (routes)/          # Protected route groups
│   ├── api/               # API routes (auth, dashboard, notifications, etc.)
│   └── dashboard/         # Main dashboard pages
├── components/            # Reusable React components
│   ├── charts/           # Chart components (Recharts)
│   ├── data-supplier/    # Supplier-related components
│   └── ui/               # Base UI components (shadcn/ui)
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities
│   ├── api/             # HTTP client and API utilities
│   ├── auth/            # Authentication logic
│   ├── config/          # Environment configuration
│   ├── security/        # Security utilities (CSRF, RBAC)
│   └── utils/           # Utility functions
└── shared/              # Shared types and constants
```

## Authentication & Security

### Session Management
- HTTP-only session cookies (`sid`) for authentication
- CSRF protection with XSRF-TOKEN cookies
- Server-side session validation via `/api/v1/auth/session`
- Automatic logout on session expiration

### Role-Based Access Control (RBAC)
```typescript
roles = {
  super_admin,     // Full access
  co_admin,        // Most admin functions
  kantor_pusat,    // Headquarters users
  kanwil_djpb,     // Regional office users
  kppn,           // Local office users
  lainnya         // Other users
}
```

### Security Features
- Comprehensive CSRF protection with automatic token refresh
- IP blocking detection and dedicated `/ip-blocked` page
- Content Security Policy headers
- Rate limiting interceptors
- Secure cookie configuration

## API Architecture

### Backend Integration
- **Development**: Proxies `/api/v1/*` to `localhost:88`
- **Production**: Proxies `/api/v1/*` to `backend:88` (Docker)
- Direct backend communication via `backendHttp` client for bypassing Next.js proxy

### API Response Format
```typescript
{
  success: boolean,
  data: any,
  error?: string
}
```

### Key API Endpoints
- `/api/v1/auth/*` - Authentication (login, logout, session, captcha)
- `/api/v1/dashboard/*` - Dashboard data
- `/api/v1/users/*` - User management
- `/api/v1/notifications/*` - Notification system
- `/api/v1/messaging/*` - Internal messaging

## HTTP Client Configuration

### Main HTTP Client (`http`)
- Base URL: Empty (same-origin)
- Includes credentials for cookies
- Automatic CSRF token attachment
- Rate limiting interceptors
- IP block detection and redirect

### Direct Backend Client (`backendHttp`)
- Base URL: Direct to backend service
- Used for bypassing Next.js proxy when needed
- Same security features as main client

### Error Handling
- 401: Automatic redirect to login with session expiration reason
- 403: Check for IP block, redirect to `/ip-blocked` if detected
- CSRF errors: Automatic token refresh and retry

## Development Workflow

### Environment Configuration
- **Development**: `localhost:88` for backend, relative API paths
- **Production**: Docker service `backend:88`, absolute URLs
- **Socket.IO**: Automatic URL resolution based on environment

### Real-time Features
- Socket.IO integration for live updates
- Connection status monitoring
- Automatic reconnection handling
- Use `socketUrl` and `socketPath` from config

### Testing Setup
- Vitest with jsdom environment
- Comprehensive mocking setup (Next.js, localStorage, fetch)
- Coverage thresholds: 80% across all metrics
- Test utilities in `src/test-setup.ts`

## Important Patterns

### Path Aliases
- `@shared/*` → `./src/shared/*` (configured in webpack and turbopack)
- `@/*` → `./src/*` (standard Next.js alias)

### Component Development
- Use Radix UI primitives with Tailwind styling
- Follow shadcn/ui patterns for components
- Implement proper TypeScript types from `@shared/types`

### API Calls
- Use `apiClient` for most API calls (goes through Next.js proxy)
- Use `directBackendClient` for direct backend communication
- Handle errors with proper user feedback
- Implement optimistic updates with React Query where appropriate

### Security Considerations
- Never disable CSRF protection
- Always validate sessions on protected routes
- Handle IP blocks gracefully
- Use secure cookie practices
- Implement proper RBAC checks

## Performance Optimizations

### Build Configuration
- Turbopack for faster development builds
- Bundle analyzer for size monitoring
- Memory-optimized builds (12GB limit)
- Standalone output for Docker deployment

### Runtime Optimizations
- React Query for data caching and synchronization
- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Advanced query caching strategies

## Docker Deployment

- Uses `standalone` output for containerized deployment
- Multi-stage builds optimized for production
- Health checks via `/api/health` endpoint
- Proper environment variable handling for container orchestration