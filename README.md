# SintesaNEx Frontend

<div align="center">

![SintesaNEx Logo](./public/favicon.ico)

**Indonesian Government Finance Dashboard**

A modern Next.js 15 application built for the Ministry of Finance of Indonesia, providing real-time financial data monitoring, reporting, and messaging capabilities within Indonesia's government financial management system.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **PostgreSQL** (for backend connectivity)
- **Redis** (for session management)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd frontendNEx

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### Development

```bash
# Start development server with Turbopack (default)
npm run dev

# Start without Turbopack
npm run dev:no-turbo

# Open browser to http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run dev:no-turbo` | Development without Turbopack |
| `npm run build` | Production build with increased memory |
| `npm run build:analyze` | Build with bundle analyzer |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run test` | Run tests with Vitest |
| `npm run test:ui` | Tests with Vitest UI |
| `npm run test:coverage` | Run tests with coverage (80% threshold) |
| `npm run clean` | Clean .next, dist, and coverage directories |
| `npm run analyze:bundle` | Analyze existing bundle |

## 🛠 Technology Stack

### Core Framework
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict configuration
- **Node.js 18+** runtime

### UI & Styling
- **Tailwind CSS v4** with custom theme
- **shadcn/ui** components built on Radix UI primitives
- **Lucide React** icons
- **Framer Motion** for animations

### Data Management
- **TanStack Query (React Query)** for server state management
- **Zustand** for client-side state management
- **React Hook Form** with Zod validation
- **Axios** for HTTP client with interceptors

### Real-time Features
- **Socket.IO Client** for WebSocket connections
- Custom WebSocket integration with React Query cache invalidation

### Testing & Quality
- **Vitest** with jsdom environment
- **Testing Library** for component testing
- **ESLint** with Next.js configuration
- **TypeScript** strict mode

### Additional Features
- **Recharts** for data visualization
- **PDF.js** and **react-pdf** for document viewing
- **XLSX** for Excel file handling
- **React Query DevTools** for debugging

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router (kebab-case URLs)
│   ├── (public)/          # Public routes (login, server-error)
│   ├── (routes)/          # Protected routes
│   ├── api/               # API routes
│   └── dashboard/         # Dashboard pages
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui base components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   ├── messaging/        # Real-time messaging components
│   └── charts/           # Data visualization components
├── features/             # Feature-specific modules
│   ├── mbg/              # MBG (Budget Implementation) feature
│   └── messaging/        # Messaging system feature
├── hooks/                # Custom React hooks
│   └── messaging-rq/     # React Query + Zustand messaging hooks
├── services/             # API services and business logic
├── stores/               # Zustand state management
├── lib/                  # Utility libraries and configurations
├── shared/               # Shared utilities and types
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Backend Configuration
NEXT_PUBLIC_BACKEND_PORT=8080
BACKEND_PORT=8080

# Session Configuration
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Optional: Google Maps API (if using map features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key

# Production HTTPS (if enabled)
HTTPS=true
```

### Next.js Configuration

The application uses a comprehensive Next.js configuration with:

- **Security Headers**: CSP, HSTS, XSS protection
- **Performance**: Image optimization, compression, bundle analysis
- **Deployment**: Standalone output for Docker
- **Development**: Turbopack with path aliases

## 🚀 Features

### 1. Financial Data Dashboard
- Real-time monitoring with role-based access control
- Interactive charts and data visualizations
- Responsive design for all device sizes

### 2. Inquiry & Reporting System
- Advanced SQL execution capabilities
- MySQL to PostgreSQL conversion
- Data export in multiple formats (Excel, PDF)

### 3. Real-time Messaging System
- WebSocket-based messaging with Socket.IO
- WhatsApp integration
- Typing indicators and read receipts
- Automatic cache invalidation

### 4. User Management
- Multi-level RBAC (Role-Based Access Control)
- Session-based authentication with Redis
- IP blocking detection and handling

### 5. Monitoring & Administration
- System health monitoring
- Performance metrics dashboard
- Real-time server status

## 🔐 Security Implementation

### Authentication & Authorization
- **Session-based authentication** with Redis TTL
- **Role-based access control** (RBAC)
- **Server-side session validation** with caching

### Data Protection
- **Content Security Policy** with restrictive defaults
- **Input validation** with Zod schemas
- **Encrypted queries** for sensitive data

### Network Security
- **CORS** configuration
- **CSRF** protection
- **Rate limiting**
- **SSL/TLS** ready for production

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once
npm run test:run
```

### Testing Strategy

- **80% Coverage Threshold** enforced across all metrics
- **User-centric testing** focused on behavior, not implementation
- **Vitest + Testing Library** for component testing
- Test files use `*.test.ts|tsx` suffix

## 📊 Performance Considerations

### Frontend Optimizations
- **React Query Caching**: 30-second stale time, 5-minute garbage collection
- **Bundle Optimization**: Package imports analyzed, webpack configuration tuned
- **Image Optimization**: WebP/AVIF formats with minimum cache TTL
- **Memory Management**: Increased Node.js memory for builds (12GB)

### State Management Pattern
- **React Query** for server state (API calls, caching, background refetch)
- **Zustand** for UI state (active conversations, form state, UI preferences)
- **WebSocket Events** automatically invalidate React Query caches
- **Optimistic Updates** for real-time user experience

## 🐳 Docker Deployment

### Build Docker Image

```bash
# Build production image
docker build -t sintesa-frontend .

# Run with docker-compose (recommended)
docker-compose -f ../docker-compose.prod.yml up -d
```

### Production Configuration

- **Standalone Output**: Configured for containerized deployment
- **Backend Proxy**: API routes proxied to backend service
- **Static Assets**: Optimized for CDN distribution
- **Security Headers**: Production-ready CSP and HSTS

## 🔄 Real-time Features

### Messaging System Architecture

The messaging system uses a sophisticated **React Query + Zustand + WebSocket** pattern:

1. **React Query Layer**: Server state management with caching and optimistic updates
2. **Zustand Layer**: UI state management for active conversations, typing indicators
3. **WebSocket Integration**: Real-time updates with automatic cache invalidation
4. **Error Resilience**: Fallback to REST API, connection retry mechanisms

### WebSocket Features

- Automatic cache invalidation on new messages
- Typing indicators and read receipts
- Connection state management with reconnection logic
- Event deduplication and cleanup

## 🛠 Development Guidelines

### Code Standards

- Import order: React/Next → external libraries → aliases → relative paths
- Component naming: `PascalCase.tsx`, hooks: `useName.ts`, utilities: `camelCase.ts`
- Use TypeScript strict mode features for better type safety
- Follow ESLint configuration (extends `eslint-config-next`)

### Component Patterns

```typescript
// shadcn/ui based components with proper TypeScript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm' | 'lg';
}
```

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

## 🐛 Troubleshooting

### Common Issues

1. **Build Memory Issues**: Use increased memory allocation (`--max-old-space-size=12288`)
2. **TypeScript Errors**: Run `npm run typecheck` to identify issues
3. **Linting Errors**: Run `npm run lint:fix` for automatic fixes
4. **Test Failures**: Check test coverage thresholds and component tests

### Performance Monitoring

- **Bundle Analysis**: Available via `npm run build:analyze`
- **React Query DevTools**: Available in development
- **WebSocket Debugging**: Event logging and connection monitoring
- **Error Tracking**: Comprehensive error boundaries and reporting

## 📝 License

This project is proprietary software developed for the Ministry of Finance of the Republic of Indonesia.

## 🤝 Contributing

Please follow the established coding standards and testing requirements when contributing to this project.

---

**Built with ❤️ for the Ministry of Finance of the Republic of Indonesia**