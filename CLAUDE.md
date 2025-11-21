# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SintesaNEx Frontend** - Indonesian government finance dashboard built for the Ministry of Finance. This is a Next.js 15 application providing a modern web interface for financial data monitoring, reporting, and messaging within Indonesia's government financial management system.

## Development Commands

### Core Development
```bash
npm run dev              # Start development server with Turbopack (default)
npm run dev:no-turbo     # Development without Turbopack
npm run build            # Production build with increased memory allocation
npm run start            # Start production server
npm run typecheck        # TypeScript checking without emitting files
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # ESLint with auto-fix
```

### Testing
```bash
npm run test             # Run tests with Vitest
npm run test:ui          # Tests with Vitest UI
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage (80% thresholds)
```

### Build Analysis & Utilities
```bash
npm run build:analyze    # Build with bundle analyzer
npm run analyze:bundle   # Analyze existing bundle
npm run clean            # Clean .next, dist, and coverage directories
npm run install:clean    # Clean node_modules and reinstall
```

## Technology Stack

### Framework & Core
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict configuration (ES2017 target)
- **Node.js 18+** runtime requirement

### UI & Styling
- **Tailwind CSS v4** with custom theme configuration
- **shadcn/ui** components built on Radix UI primitives
- **Lucide React** icons (configurable via components.json)
- **Framer Motion** for animations via the `motion` package

### Data Management
- **TanStack Query (React Query)** for server state management and caching
- **Zustand** for client-side state management
- **React Hook Form** with Zod validation for forms
- **Axios** for HTTP client with interceptors

### Real-time Features
- **Socket.IO Client** for WebSocket connections
- Custom WebSocket integration with React Query cache invalidation

### Development & Testing
- **Vitest** with jsdom environment for unit testing
- **Testing Library** for component testing
- **ESLint** with Next.js configuration
- **TypeScript** compiler with strict type checking

### Additional Features
- **Recharts** for data visualization
- **React Query DevTools** for debugging API state
- **date-fns** for date manipulation
- **PDF.js** and **react-pdf** for document viewing
- **XLSX** for Excel file handling

## Architecture Patterns

### Directory Structure
```
src/
├── app/                    # Next.js App Router (kebab-case URLs)
├── components/             # Reusable UI components
│   ├── ui/                # shadcn/ui base components
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Dashboard-specific components
│   ├── messaging/         # Real-time messaging components
│   └── ...
├── features/              # Feature-specific modules
│   ├── mbg/               # MBG (Budget Implementation) feature
│   └── messaging/         # Messaging system feature
├── hooks/                 # Custom React hooks
│   └── messaging-rq/      # React Query + Zustand messaging hooks
├── services/              # API services and business logic
├── stores/                # Zustand state management
├── lib/                   # Utility libraries and configurations
├── shared/                # Shared utilities and types
├── types/                 # TypeScript type definitions
└── utils/                 # Helper functions
```

### Key Architectural Decisions

#### State Management Pattern
- **React Query** for server state (API calls, caching, background refetch)
- **Zustand** for UI state (active conversations, form state, UI preferences)
- WebSocket events automatically invalidate React Query caches
- Optimistic updates for real-time user experience

#### Component Architecture
- Feature-based organization with clear separation of concerns
- shadcn/ui components as the base UI layer
- Compound component patterns for complex features
- Server Components for static content, Client Components for interactivity

#### API Integration
- Centralized API configuration with interceptors
- React Query hooks with TypeScript query keys
- Background refetch and cache invalidation strategies
- Error boundaries and retry mechanisms

#### Authentication & Security
- Session-based authentication via middleware
- Server-side session validation with caching
- IP blocking detection and handling
- Comprehensive security headers (CSP, HSTS, etc.)

## Configuration Files

### Next.js Configuration (next.config.ts)
- **Security**: Comprehensive headers, CSP, HSTS in production
- **Performance**: Image optimization, package imports, compression
- **Deployment**: Standalone output for Docker, proxy rewrites to backend
- **Development**: Turbopack with path aliases, bundle analyzer support

### TypeScript Configuration
- **Strict Mode**: Enabled with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- **Path Aliases**: `@/*` for src, `@shared/*` for shared utilities
- **Next.js Integration**: Proper plugin configuration and type checking

### Vitest Configuration
- **Environment**: jsdom for component testing
- **Coverage**: 80% thresholds with v8 provider
- **Setup Files**: Custom test setup with Testing Library
- **Path Aliases**: Consistent with TypeScript configuration

## Development Guidelines

### Code Standards
- Import order: React/Next → external libraries → aliases → relative paths
- Component naming: `PascalCase.tsx`, hooks: `useName.ts`, utilities: `camelCase.ts`
- Use TypeScript strict mode features for better type safety
- Follow ESLint configuration (extends `eslint-config-next`)

### Testing Strategy
- **80% Coverage Thresholds** enforced across all metrics
- **User-centric testing** focused on behavior, not implementation
- **Vitest + Testing Library** for component testing
- Test files use `*.test.ts|tsx` suffix in `test/` directory or alongside source

### Performance Considerations
- **React Query Caching**: 30-second stale time, 5-minute garbage collection
- **Bundle Optimization**: Package imports analyzed, webpack configuration tuned
- **Memory Management**: Increased Node.js memory for builds (12GB)
- **Image Optimization**: WebP/AVIF formats with minimum cache TTL

### Security Implementation
- **Session-based authentication** with server-side validation
- **Content Security Policy** with restrictive defaults
- **IP-based blocking** with automatic detection and handling
- **Optimistic auth** only in development, strict validation in production

## Real-time Features

### Messaging System Architecture
The messaging system uses a sophisticated **React Query + Zustand + WebSocket** pattern:

1. **React Query Layer**: Server state management with caching and optimistic updates
2. **Zustand Layer**: UI state management for active conversations, typing indicators
3. **WebSocket Integration**: Real-time updates with automatic cache invalidation
4. **Error Resilience**: Fallback to REST API, connection retry mechanisms

### WebSocket Integration
- Automatic cache invalidation on new messages
- Typing indicators and read receipts
- Connection state management with reconnection logic
- Event deduplication and cleanup

## Environment Variables

### Required for Development
- `NEXT_PUBLIC_BACKEND_PORT` or `BACKEND_PORT`: Backend API port
- Session and authentication configuration
- Google Maps API key (if using map features)

### Production Considerations
- HTTPS configuration for security headers
- Backend host configuration for Docker environments
- Session secret and Redis configuration

## Common Development Patterns

### Custom Hooks
```typescript
// React Query pattern with TypeScript
export function useQuickStats() {
  return useQuery<QuickStatView[], Error>({
    queryKey: queryKeyFactories.financial.mbg.quickStats(),
    queryFn: getQuickStats,
    ...createQueryOptions('financial'),
    gcTime: 5 * 60_000,
  });
}
```

### Component Patterns
```typescript
// shadcn/ui based components with proper TypeScript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}
```

### State Management
```typescript
// Zustand store with TypeScript selectors
interface MessagingState {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
}

export const useMessagingStore = create<MessagingState>((set) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
}));
```

## Deployment Notes

### Docker Configuration
- **Standalone Output**: Configured for containerized deployment
- **Backend Proxy**: API routes proxied to backend service
- **Static Assets**: Optimized for CDN distribution
- **Security Headers**: Production-ready CSP and HSTS

### Performance Monitoring
- **Bundle Analysis**: Available via `npm run build:analyze`
- **React Query DevTools**: Available in development
- **WebSocket Debugging**: Event logging and connection monitoring
- **Error Tracking**: Comprehensive error boundaries and reporting