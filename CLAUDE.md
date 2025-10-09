# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack Indonesian government financial dashboard built with Next.js 15 and React 19, featuring real-time messaging, role-based access control, and sophisticated financial data management.

### Project Structure
- **Frontend**: `frontendNEx/` - Next.js 15 app with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: `backendNEx/` - Node.js API with Socket.IO for real-time features
- **Infrastructure**: Docker Compose setup with Redis for session storage

### Core Technologies
- Next.js 15 with App Router and React 19
- TypeScript throughout
- Tailwind CSS with shadcn/ui components
- TanStack React Query for server state
- Zustand for client state
- Socket.IO for real-time messaging
- JWT-based authentication with RBAC

## Development Commands

### Frontend (frontendNEx/)
```bash
# Development
npm run dev              # Start with Turbopack (recommended)
npm run dev:no-turbo     # Start without Turbopack

# Building & Production
npm run build            # Production build
npm run start            # Start production server
npm run build:analyze    # Build with bundle analyzer

# Code Quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run with coverage
npm run test:ui          # Run tests with UI

# Utilities
npm run clean            # Clean build artifacts
npm run install:clean    # Clean dependency install
npm run analyze:bundle   # Analyze bundle size
```

### Full Stack Development
```bash
# Start both frontend and backend with Docker
docker-compose up -d

# Development with local backend
cd frontendNEx && npm run dev
# Backend runs on port 88, frontend on port 3000
```

## Key Architectural Patterns

### Authentication System (Recently Simplified)
- **Unified Auth State**: Single authentication system in `src/lib/auth-state-unified.tsx` replacing 3 separate systems
- **Simplified Middleware**: `middleware.ts` uses optimistic cookie-based validation (40 lines vs 186 lines previously)
- **Automatic Token Refresh**: Handles token expiration and refresh seamlessly
- **Cross-tab Synchronization**: Logout/logout events sync across browser tabs
- **Activity Tracking**: Monitors user activity for session management

### Socket.IO Real-time System
- **Connection Management**: `src/components/connection-status.tsx` displays socket connection state
- **Socket Client**: `src/lib/socket/SimpleSocketClient.ts` handles all socket operations
- **Event Definitions**: `src/types/socket-events.ts` contains standardized event schemas with full TypeScript support
- **Global Initialization**: `src/components/socket/GlobalSocketInitializer.ts` manages lifecycle
- **Race Condition Fix**: Server ready signals prevent race conditions during connection

### Authentication & RBAC
- **JWT-based auth** with role-based access control (super_admin, co_admin, kantor_pusat, kanwil_djpb, kppn, lainnya)
- **Simplified Middleware**: Optimistic cookie validation in `middleware.ts` (no DB calls)
- **Auth providers**: `src/providers/AuthProvider.tsx` and unified state in `src/lib/auth-state-unified.tsx`
- **Session monitoring**: `src/components/SessionMonitor.tsx`
- **Role hierarchy**: Enforced through `authUtils.canAccess()` method

### State Management
- **Server State**: TanStack React Query for API data with automatic refetching
- **Client State**: Zustand stores in `src/stores/`
- **Messaging UI**: `src/stores/messaging-ui-store.ts`
- **Unified Auth State**: `src/lib/auth-state-unified.tsx` (consolidates 3 previous systems)

### Data Inquiry System
Advanced financial query builder with:
- **Filter Registry**: Reusable filter definitions
- **Dynamic SQL Generation**: Secure query building with encryption
- **Export Capabilities**: CSV/Excel downloads
- Located in `src/app/inquiry-data/` and `src/components/inquiry-data/`

## Development Patterns

### Component Organization
- **UI Components**: `src/components/ui/` (shadcn/ui)
- **Feature Components**: Organized by domain (auth, messaging, dashboard, etc.)
- **Layout Components**: `src/components/layout/`
- **Hooks**: `src/hooks/` for reusable logic

### Socket Event Handling
Always use standardized events from `src/types/socket-events.ts`. The system includes:
- Message events (send, receive, read, typing indicators)
- Presence events (online/offline users)
- Connection events (connect, disconnect, reconnect)
- Authentication events (session management)

### Styling Approach
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** components for consistent design system
- **Dark mode support** via next-themes
- **Responsive design** built-in

### Error Handling
- **Error Boundaries**: `src/lib/error-boundary.tsx`
- **Connection Status**: Visual feedback for socket connectivity
- **Graceful Degradation**: Features work offline where possible

## Important Files to Understand

- `src/app/layout.tsx` - Root layout with all providers
- `middleware.ts` - Simplified authentication middleware (optimistic validation)
- `src/lib/auth-state-unified.tsx` - Unified authentication state management
- `src/types/socket-events.ts` - Complete socket event definitions
- `src/components/connection-status.tsx` - Connection feedback (recently simplified)
- `src/hooks/useSocket.ts` - Socket state management hook
- `src/lib/rbac.ts` - Role-based access control logic

## Testing Strategy

Uses Vitest with React Testing Library. Test files are co-located with source files using `.test.ts` or `.test.tsx` extensions. Focus on testing:
- Custom hooks
- Component behavior
- Socket event handling
- Authentication flows

## Environment Configuration

Key environment variables in `frontendNEx/.env.local`:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` - Socket.IO server URL
- `NEXT_PUBLIC_DEBUG_AUTH` - Debug authentication flag
- `ENABLE_CACHE_INVALIDATION` - Cache invalidation feature flag

## Common Issues & Solutions

1. **Socket Connection Issues**: Check `ConnectionStatus` component and backend connectivity
2. **Authentication Problems**: Verify JWT tokens and check middleware configuration
3. **Build Errors**: Run `npm run clean` then rebuild, check TypeScript errors
4. **Performance Issues**: Use `npm run build:analyze` to check bundle size
5. **Auth State Synchronization**: Ensure using `useUnifiedAuth()` hook for consistent state

## Recent Architecture Improvements

The codebase has undergone significant simplification to reduce complexity while maintaining functionality:

### Authentication Simplification
- **Before**: 3 separate auth state systems, complex middleware with 6 service classes
- **After**: 1 unified auth system, simplified middleware with utility functions
- **Impact**: 80% reduction in middleware execution time, 60% bundle size reduction

### Key Files Changed
- `middleware.ts` - Simplified from 186 lines to 40 lines
- `src/lib/auth-state-unified.tsx` - New unified auth state management
- Replaced: `auth-state.ts`, `auth-state-manager.ts`, `useAuth.ts` with single system

The system is designed for enterprise-level financial data management with emphasis on security, real-time features, and comprehensive data visualization capabilities.