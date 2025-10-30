# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **indo-finance-dashboard**, a Next.js 15.5.6 TypeScript application serving as a comprehensive financial dashboard for Indonesian government financial data. The application features real-time messaging, data analytics, inquiry systems, and multi-module navigation.

## Quick Start

```bash
# Install dependencies
npm install

# Development server with Turbopack (fast refresh)
npm run dev

# Development without Turbopack
npm run dev:no-turbo

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Lint and fix
npm run lint
npm run lint:fix

# Clean build artifacts
npm run clean
```

## Key Commands

```bash
# Run a single test file
npm test -- filename.test.ts

# Run tests with UI
npm run test:ui

# Build with bundle analysis
npm run build:analyze

# Clean install (removes node_modules and reinstalls)
npm run install:clean

# Run tests in CI mode
npm run test:run
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript 5.9.3
- **UI**: React 19.2.0, Tailwind CSS 4.1.15, Radix UI components
- **State Management**: Zustand (stores), TanStack Query (server state)
- **Real-time**: Socket.IO client for messaging
- **Testing**: Vitest 3.2.4 with Testing Library
- **Styling**: Tailwind CSS with shadcn/ui components

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (login, error pages)
│   ├── (routes)/                 # Route groups with shared layouts
│   ├── api/                      # API routes (proxy to backend)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── v1/                   # API v1 endpoints
│   │   ├── messaging/            # Messaging API
│   │   ├── notifications/        # Notifications API
│   │   ├── dashboard/            # Dashboard data API
│   │   ├── inquiry-data/         # Data inquiry APIs
│   │   ├── users/                # User management API
│   │   └── ...
│   ├── dashboard/                # Main dashboard module
│   ├── inquiry-data/             # Data inquiry (belanja, kontrak, etc.)
│   ├── messaging/                # Real-time messaging
│   ├── notifications/            # Notification center
│   ├── epa/                      # Environmental/performance monitoring
│   ├── transfer-daerah/          # Regional transfer data
│   ├── data-supplier/            # Supplier data module
│   ├── makan-bergizi/            # Nutrition program module
│   └── ...
├── components/                   # Reusable UI components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard-specific components
│   ├── inquiry-data/             # Data inquiry components
│   ├── messaging/                # Messaging components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   └── ...
├── hooks/                        # Custom React hooks
│   ├── dashboard/                # Dashboard data hooks
│   ├── inquiry-data/             # Data fetching hooks
│   ├── messaging/                # Messaging hooks
│   └── use-*.ts                  # Feature-specific hooks
├── lib/                          # Core utilities and config
│   ├── api/                      # API client utilities
│   ├── auth/                     # Authentication logic
│   ├── cache/                    # Query caching
│   ├── config/                   # App configuration (src/lib/config/config.ts:93)
│   ├── security/                 # RBAC, CSRF protection
│   └── utils/                    # Helper functions
├── features/                     # Feature-specific modules
│   ├── mbg/                      # Map visualization features
│   └── messaging/                # Messaging features
├── stores/                       # Zustand stores
│   ├── messaging-store.ts        # Chat state
│   ├── notification-store.ts     # Notifications state
│   └── ...
├── types/                        # TypeScript type definitions
├── utils/                        # Utility functions
├── patterns/                     # Design patterns
└── query-builders/               # SQL query builders
```

### Configuration

**Unified Configuration** (`src/lib/config/config.ts:93`)
- Single source of truth for environment variables
- Handles API URL detection (client vs server)
- Socket.IO URL auto-detection
- Environment-based configuration (dev/prod)

**Environment Variables** (`.env.example`)
- `NEXT_PUBLIC_API_URL`: Client-side API URL
- `API_URL`: Server-side API URL (Docker: `http://backend:88/api/v1`)
- `NEXT_PUBLIC_SOCKET_ORIGIN`: Socket.IO server URL
- `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`: JWT configuration

### Authentication & Security

**Middleware** (`middleware.ts:1`)
- Consolidated Next.js middleware for authentication
- Cookie-based session validation
- IP blocking functionality
- Protected routes: `/dashboard`, `/inquiry-data`, `/users`, `/messages`, etc.
- Public routes: `/login`, `/unauthorized`, `/ip-blocked`, etc.

**Session Management**
- Session ID cookie (`sid`)
- Optimistic validation in development
- Server-side session validation via `/api/v1/auth/session`

### API Integration

**Backend Communication**
- API routes in `/app/api/` proxy requests to backend service
- Default backend URL: `http://localhost:88` (dev), `http://backend:88` (Docker)
- React Query for server state caching and synchronization
- Socket.IO for real-time features

**Key API Endpoints**
- `/api/v1/auth/*` - Authentication
- `/api/v1/users/*` - User management
- `/api/messaging/*` - Chat functionality
- `/api/notifications/*` - Notifications
- `/api/dashboard/*` - Dashboard data
- `/api/inquiry-data/*` - Financial data queries

### Data Management

**React Query Integration**
- Server state management
- Query caching and invalidation
- Optimistic updates
- Background refetching

**Zustand Stores**
- `messaging-store.ts`: Chat state, conversations, messages
- `notification-store.ts`: Notification state
- `typing-indicators-store.ts`: Real-time typing indicators
- `unread-badges-store.ts`: Unread message counts

### Key Modules

**1. Dashboard** (`/app/dashboard/`)
- Main analytics dashboard
- Real-time performance monitoring
- Program overview cards
- Quick statistics

**2. Inquiry Data** (`/app/inquiry-data/`)
- Financial data exploration
- Dynamic filter system
- Query builder interface
- Export capabilities
- Saved queries

**3. Messaging** (`/app/messaging/`)
- Real-time chat system
- Socket.IO integration
- Message status tracking
- Typing indicators

**4. Transfer Daerah** (`/app/transfer-daerah/`)
- Regional transfer data
- DAU (Dana Alokasi Umum) tracking
- KMK (Kredit Millionaire Kecil) management
- Report generation

**5. EPA** (`/app/epa/`)
- Performance monitoring
- Budget analysis
- KPI tracking

### Testing

**Test Setup** (`vitest.config.ts`, `src/test-setup.ts`)
- Vitest with jsdom environment
- Testing Library for React components
- Coverage thresholds: 80% for lines, functions, branches, statements
- Setup file: `src/test-setup.ts`

**Test Locations**
- `test/` - Integration and E2E tests
- `src/**/__tests__/` - Component tests
- `test/**/__tests__/` - Feature tests

### Docker Support

**Multi-stage Dockerfile** (`Dockerfile`)
- Base: Node.js 20-alpine
- Dependencies stage
- Builder stage with build optimization
- Runner stage with non-root user
- Healthcheck enabled
- Port: 3000

**Development Docker**
- `Dockerfile.dev` for development
- Internal networking: frontend → backend:88

### Performance Optimizations

**Next.js Configuration** (`next.config.ts`)
- Image optimization (WebP, AVIF)
- Console removal in production
- Security headers (X-Frame-Options, CSP, etc.)
- Compression enabled
- Turbopack support

**Bundle Optimization**
- Tree-shaking enabled
- Code splitting
- Dynamic imports for heavy components
- Bundle analyzer: `npm run build:analyze`

### Development Workflow

1. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Configure NEXT_PUBLIC_API_URL=http://localhost:88/api/v1
   ```

2. **Start Development**
   ```bash
   npm run dev
   ```

3. **Backend Requirements**
   - Backend service on port 88 (localhost) or backend:88 (Docker)
   - Socket.IO server for messaging

4. **Testing**
   ```bash
   npm run test        # Watch mode
   npm run test:run    # Single run
   npm run test:coverage # Coverage report
   ```

### Important Files

- `src/lib/config/config.ts` - Unified configuration
- `middleware.ts` - Authentication & routing
- `src/lib/auth/` - Authentication logic
- `src/hooks/` - Data fetching hooks
- `src/components/ui/` - Base UI components
- `package.json` - Scripts and dependencies

### Common Development Tasks

**Adding a New Feature Module**
1. Create route: `src/app/feature-name/`
2. Add API routes: `src/app/api/feature-name/`
3. Create hooks: `src/hooks/use-feature-name.ts`
4. Add components: `src/components/feature-name/`
5. Update middleware.ts if new protected routes

**Adding a New API Endpoint**
1. Create route handler: `src/app/api/v1/endpoint/route.ts`
2. Use unified config: `import { apiPath } from '@/lib/config/config'`
3. Implement fetch with proper error handling
4. Add tests in `test/`

**State Management**
- Use React Query for server state
- Use Zustand for client state
- Follow pattern: `stores/feature-store.ts`

### Troubleshooting

**Build Issues**
```bash
npm run clean && npm run install:clean
npm run type-check
```

**Type Errors**
- Enable `noUncheckedIndexedAccess` in tsconfig.json
- Check strict mode compliance
- Use proper type assertions

**API Connection Issues**
- Verify backend is running on port 88
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Inspect middleware.ts for routing logic

**Socket.IO Connection Issues**
- Verify `NEXT_PUBLIC_SOCKET_ORIGIN` configuration
- Check CORS settings on backend
- Ensure proper authentication cookies

### Deployment

**Production Build**
```bash
NODE_ENV=production npm run build
npm run start
```

**Docker Deployment**
```bash
docker build -t indo-finance-dashboard .
docker run -p 3000:3000 indo-finance-dashboard
```

**Environment Variables**
- Set `NODE_ENV=production`
- Configure `API_URL` for server-side
- Set `NEXT_PUBLIC_API_URL` for client-side
- Configure JWT secrets
