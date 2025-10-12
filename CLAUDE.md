# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run dev:no-turbo` - Start development server without Turbopack
- `npm run build` - Build production application
- `npm run build:analyze` - Build with bundle analyzer
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI interface
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report

### Utilities
- `npm run clean` - Clean build artifacts and caches
- `npm run install:clean` - Clean install dependencies

## Architecture Overview

This is an Indonesian finance dashboard (SintesaNEXT) built with Next.js 15, React 19, and TypeScript. The application handles financial data visualization, reporting, and user management with real-time capabilities.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Radix UI components, Tailwind CSS, shadcn/ui
- **State Management**: Zustand for client state, React Query (@tanstack/react-query) for server state
- **Data Fetching**: Axios, React Query with WebSocket support
- **Styling**: Tailwind CSS with custom design system
- **Testing**: Vitest, Testing Library
- **Real-time**: Socket.io client for live updates

### Key Features
- Financial dashboard with real-time data visualization
- User authentication and authorization (JWT-based)
- Role-based access control (RBAC)
- Messaging system with React Query + Zustand + WebSocket
- Inquiry data filtering with SSOT (Single Source of Truth) registry
- PDF document handling and viewing
- Export capabilities (CSV, Excel)
- Responsive design with mobile support

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API endpoints
│   ├── (auth)/            # Auth-related pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   ├── messaging/        # Messaging system components
│   └── inquiry-data/     # Data inquiry components
├── features/              # Feature-specific modules
│   └── mbg/              # Map-based features
├── hooks/                 # Custom React hooks
│   └── messaging-rq/     # React Query messaging hooks
├── lib/                   # Utility libraries
├── stores/               # Zustand stores
├── data/                 # Static data and JSON files
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── styles/               # Global styles
```

## Key Patterns and Systems

### 1. Inquiry Data System (SSOT)
The inquiry system uses a **Single Source of Truth (SSOT)** pattern for filter management:

- **Registry**: `src/components/inquiry-data/filterRegistry.ts` - Central filter definitions
- **Filter Cards**: `src/components/inquiry-data/filter-card.tsx` - UI filter components
- **Query Builder**: `src/hooks/use-inquiry-query-builder.ts` - SQL generation from filters

When adding new filters:
1. Define in `filterRegistry.ts` with key, label, order, and query mapping
2. Add options in `filter-card.tsx` if needed
3. The system automatically handles UI, SQL, and export ordering

### 2. Messaging System Architecture
Complete **React Query + Zustand + WebSocket** implementation:

- **Data Layer**: React Query for caching and synchronization
- **UI State**: Zustand stores for real-time UI state
- **Real-time**: WebSocket integration with automatic cache invalidation

Main hook: `useMessagingRQ()` provides comprehensive messaging functionality.

### 3. Authentication & Authorization
- JWT-based authentication with middleware protection
- Role-based access control (RBAC) system
- Session monitoring and automatic logout
- Protected routes and API endpoints

### 4. Performance Optimizations
- React Query with stale-while-revalidate strategy
- Bundle splitting and code splitting
- Image optimization with Next.js
- WebSocket connection pooling
- Performance monitoring utilities

## Important Configuration

### Security Headers
The application includes comprehensive security headers in `next.config.ts`:
- CSP (Content Security Policy)
- HSTS (HTTPS enforcement in production)
- XSS protection
- Clickjacking prevention

### Development Proxy
API requests to `/api/v1/*` are proxied to `http://localhost:88/api/v1/*` for development.

### Bundle Analysis
Run `npm run build:analyze` to generate bundle analysis reports.

## Testing Strategy

- **Unit Tests**: Component and hook testing with Vitest
- **Integration Tests**: API route testing
- **Coverage**: Configured with comprehensive reporting
- **Test Utilities**: Custom testing utilities in `src/test-setup.ts`

## Common Development Tasks

### Adding New API Endpoints
1. Create route in `src/app/api/`
2. Add type definitions in `src/types/`
3. Create React Query hooks in appropriate feature directory

### Adding New UI Components
1. Base components go in `src/components/ui/`
2. Feature-specific components go in feature directories
3. Follow existing component patterns with proper TypeScript types

### State Management
- Use React Query for server state
- Use Zustand stores for client state
- Keep stores small and focused
- Use proper TypeScript typing throughout

## Development Notes

### Environment Setup
- Node.js 18+ required
- Development server runs on default Next.js port (3000)
- Backend API expected on localhost:88

### Code Style
- ESLint configuration in `eslint.config.mjs`
- TypeScript strict mode enabled
- Tailwind CSS for styling
- Consistent component patterns

### Performance Considerations
- Use React Query for data fetching
- Implement proper loading states with skeleton components
- Optimize images and assets
- Monitor bundle size regularly

### WebSocket Usage
- Real-time messaging and notifications
- Connection status monitoring
- Automatic reconnection handling
- Fallback to REST API when needed
