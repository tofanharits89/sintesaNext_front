# Indo Finance Dashboard (sintesaNEXT)

A comprehensive financial dashboard application for Indonesian government finance management, built with Next.js 15, React 19, and modern web technologies.

## 🏗️ Architecture Overview

This is a full-stack Next.js application with a sophisticated architecture designed for enterprise-level financial data management:

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand + React Query (TanStack Query)
- **Authentication**: JWT-based with role-based access control (RBAC)
- **Real-time Features**: Socket.IO for messaging and notifications
- **Data Visualization**: Recharts for financial charts and analytics
- **Testing**: Vitest with React Testing Library

## 🚀 Key Features

### 📊 Financial Data Management
- **Inquiry Data System**: Advanced query builder for financial data analysis
  - Dynamic filter system with registry-based architecture
  - SQL query generation with encryption
  - Support for multiple report types (Pagu APBN, Realisasi, etc.)
  - Export capabilities (CSV, Excel)
  
- **Dashboard Analytics**: Real-time financial monitoring
  - Performance metrics and KPIs
  - Interactive charts and visualizations
  - Regional data analysis (Province/Regency)

### 🔐 Security & Authentication
- **Enterprise-grade Authentication**: JWT with refresh tokens
- **Role-Based Access Control (RBAC)**: 
  - Super Admin, Co-Admin, Kantor Pusat, Kanwil DJPb, KPPN, Lainnya
  - Hierarchical access control based on organizational structure
- **Advanced Middleware**: Session validation with caching and security headers
- **Cache Invalidation**: Dynamic cache management for logout events

### 💬 Messaging System
- **Real-time Messaging**: Socket.IO-based chat system
- **Typing Indicators**: Live typing status
- **Unread Badges**: Message count management
- **Notification System**: In-app and browser notifications

### 🏢 Organizational Data
- **Satker Management**: Government unit (Satuan Kerja) search and profiles
- **Supplier Analytics**: Data supplier dashboard and analytics
- **Transfer Daerah**: Regional transfer data management
- **EPA (Electronic Procurement Analytics)**: Procurement data analysis

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (routes)/                 # Route groups
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── dashboard/            # Dashboard APIs
│   │   ├── inquiry-data/         # Data inquiry APIs
│   │   └── ...                   # Other API endpoints
│   ├── dashboard/                # Main dashboard pages
│   ├── data-supplier/            # Supplier analytics
│   ├── inquiry-data/             # Data inquiry system
│   │   ├── belanja/              # Budget expenditure
│   │   ├── kontrak/              # Contract data
│   │   └── tematik/              # Thematic analysis
│   ├── login/                    # Authentication pages
│   ├── messaging/                # Chat system
│   └── ...                       # Other feature pages
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── inquiry-data/             # Query builder components
│   ├── messaging/                # Chat components
│   ├── ui/                       # shadcn/ui components
│   └── ...                       # Feature-specific components
├── features/                     # Feature modules
│   ├── mbg/                      # Makan Bergizi feature
│   └── messaging/                # Messaging feature logic
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
│   ├── auth-state.ts             # Authentication state
│   ├── cache-manager.ts          # Cache management
│   ├── rbac.ts                   # Role-based access control
│   └── ...                       # Other utilities
├── providers/                    # React context providers
├── services/                     # Business logic services
├── stores/                       # Zustand state stores
│   ├── messaging-ui-store.ts     # Messaging UI state
│   ├── notification-store.ts     # Notifications
│   └── ...                       # Other stores
├── types/                        # TypeScript type definitions
└── utils/                        # Utility functions
```

## 🛠️ Technology Stack

### Core Technologies
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework

### UI & Components
- **shadcn/ui**: Modern component library based on Radix UI
- **Lucide React**: Icon library
- **Recharts**: Data visualization
- **React Hook Form**: Form management with Zod validation

### State Management & Data Fetching
- **TanStack React Query**: Server state management
- **Zustand**: Client state management
- **Socket.IO Client**: Real-time communication

### Development & Testing
- **Vitest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting (via Tailwind)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to backend API services

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd indo-finance-dashboard
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Setup**
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000

# Authentication
NEXT_PUBLIC_DEBUG_AUTH=0

# Feature Flags
ENABLE_CACHE_INVALIDATION=1
CACHE_INVALIDATE_SECRET=your-secret-key

# Database (for API routes)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=monev
DB_PORT=3306
```

4. **Development Server**
```bash
npm run dev
# or with Turbopack (faster)
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run dev:no-turbo     # Start development server without Turbopack

# Building
npm run build            # Build for production
npm run build:analyze    # Build with bundle analyzer
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage

# Utilities
npm run clean            # Clean build artifacts
npm run install:clean    # Clean install dependencies
npm run analyze:bundle   # Analyze bundle size
```

## 🔑 Authentication & Authorization

### User Roles
- **super_admin**: Full system access
- **co_admin**: Administrative access
- **kantor_pusat**: Central office access
- **kanwil_djpb**: Regional office access (filtered by kdkanwil)
- **kppn**: Local office access (filtered by kdkppn)
- **lainnya**: Limited access

### RBAC Implementation
The system implements hierarchical access control:
- Users can only access data within their organizational scope
- Satker search is filtered based on user's kdkanwil/kdkppn
- API endpoints respect user permissions
- UI components adapt based on user roles

## 🔍 Key Features Deep Dive

### Inquiry Data System
Advanced query builder with:
- **Filter Registry**: Reusable filter definitions
- **Category Registry**: Thematic analysis categories
- **Dynamic SQL Generation**: Secure query building
- **Export Capabilities**: CSV and Excel downloads
- **Real-time Preview**: SQL query preview for admins

### Messaging System
Real-time communication with:
- **WebSocket Integration**: Live messaging
- **Typing Indicators**: Real-time typing status
- **Unread Management**: Message count tracking
- **Notification System**: In-app and browser notifications

### Dashboard Analytics
Comprehensive financial monitoring:
- **Performance Metrics**: KPI tracking
- **Regional Analysis**: Province/regency data
- **Interactive Charts**: Recharts visualizations
- **Real-time Updates**: Live data refresh

## 🧪 Testing

The project uses Vitest for testing with comprehensive coverage:

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

Test files are located alongside source files with `.test.ts` or `.test.tsx` extensions.

## 📦 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Configuration
Ensure all environment variables are properly configured for production:
- API endpoints
- Database connections
- Authentication secrets
- Feature flags

### Performance Optimizations
- **Bundle Analysis**: Use `npm run build:analyze` to analyze bundle size
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Aggressive caching strategies for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure code passes linting and type checking

## 📚 Documentation

Additional documentation is available in the `docs/` directory:
- [RBAC Implementation](docs/RBAC_IMPLEMENTATION.md)
- [Query Builder Documentation](docs/QUERY_BUILDER_DOCUMENTATION.md)
- [Filter Registry System](docs/FILTER_REGISTRY_SYSTEM.md)
- [Authentication Improvement Plan](docs/authentication-improvement-plan.md)

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Issues**
   - Check backend API connectivity
   - Verify JWT token configuration
   - Clear browser cookies and localStorage

2. **Build Errors**
   - Run `npm run clean` to clear build cache
   - Check TypeScript errors with `npm run type-check`
   - Verify all dependencies are installed

3. **Performance Issues**
   - Use bundle analyzer to identify large dependencies
   - Check for memory leaks in React components
   - Optimize database queries

## 📄 License

This project is proprietary software for Indonesian government financial management.

## 🙋‍♂️ Support

For support and questions:
- Check the documentation in the `docs/` directory
- Review existing issues and discussions
- Contact the development team

---

**sintesaNEXT** - Modern Financial Dashboard for Indonesian Government Finance Management