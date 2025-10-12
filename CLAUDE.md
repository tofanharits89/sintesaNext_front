# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack (faster builds)
- `npm run dev:no-turbo` - Start development server without Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking without emit

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Run tests with coverage report

### Build Analysis
- `npm run build:analyze` - Build and analyze bundle size
- `npm run analyze:bundle` - Analyze existing bundle

### Maintenance
- `npm run clean` - Clean build artifacts and coverage
- `npm run install:clean` - Clean install dependencies

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand for client state, TanStack Query for server state
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Turbopack (development), Webpack (production)

### Project Structure

```
src/
├── app/                 # Next.js App Router pages and layouts
├── components/          # Reusable React components
│   └── ui/             # shadcn/ui components
├── features/           # Feature-specific components and logic
├── hooks/              # Custom React hooks
├── lib/                # Core utilities and configurations
├── services/           # External service integrations
├── shared/             # Shared utilities and types
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Key Architectural Patterns

#### Authentication & Security
- **Middleware-based route protection**: `middleware.ts` handles authentication for protected routes
- **HttpOnly cookies**: Stores JWT tokens securely
- **Server-side validation**: Middleware validates tokens with backend on protected routes
- **CORS headers**: Comprehensive security headers configured in `next.config.ts`

#### State Management
- **Zustand stores**: Located in `src/stores/`, separated by concern (messaging, notifications, etc.)
- **TanStack Query**: Handles server state with caching and synchronization
- **Cross-tab sync**: Real-time state synchronization across browser tabs

#### API Integration
- **Base API client**: `src/lib/api.ts` and `src/lib/http-client.ts`
- **Axios-based**: Centralized HTTP client with interceptors
- **Error handling**: Comprehensive error boundary and retry logic
- **Socket.io**: Real-time communication via `src/lib/socket-client.ts`

#### Component Architecture
- **shadcn/ui**: Pre-built components with consistent design system
- **Feature-based organization**: Components grouped by domain feature
- **Server components**: Leveraging Next.js App Router for server-side rendering

### Environment Configuration

#### Development
- Backend API: `http://localhost:88` (configurable via `NEXT_PUBLIC_API_BASE_URL`)
- Environment files: `.env.local`, `.env.dev`

#### Production
- Standalone output mode for Docker deployment
- Optimized bundle with tree-shaking
- Security headers and CSP policies

### Key Files to Understand

#### Configuration
- `next.config.ts` - Next.js configuration with security headers and optimization
- `middleware.ts` - Authentication middleware and route protection
- `tsconfig.json` - TypeScript configuration with strict mode
- `vitest.config.ts` - Test configuration

#### Core Libraries
- `src/lib/auth-client.ts` - Authentication utilities
- `src/lib/cache-manager.ts` - Client-side caching strategy
- `src/lib/rbac.ts` - Role-based access control
- `src/stores/index.ts` - State management exports

### Common Patterns

#### Error Handling
- Error boundaries: `src/lib/error-boundary.tsx`
- API error responses with consistent structure
- Graceful degradation for network issues

#### Performance
- Lazy loading for components and routes
- Image optimization with Next.js Image component
- Bundle analysis and code splitting

#### Testing
- Component testing with React Testing Library
- Coverage thresholds: 80% across all metrics
- Test utilities in `src/test-setup.ts`

## Development Workflow

1. **Local Development**: Use `npm run dev` for Turbopack-enabled fast refresh
2. **Type Safety**: Run `npm run type-check` before committing
3. **Testing**: Ensure `npm run test:coverage` passes before PR
4. **Build Verification**: Test production build with `npm run build`
5. **Code Quality**: Run `npm run lint:fix` to auto-fix linting issues

## Important Notes

- This is a finance dashboard application with Indonesian language support
- Authentication uses JWT tokens stored in HttpOnly cookies
- Real-time features implemented via Socket.io
- Comprehensive security configuration for production deployment
- Cross-browser compatibility including legacy browser support