# SintesaNEx Frontend

<div align="center">

![SintesaNEx Logo](./public/favicon.ico)

**Indonesian Government Finance Dashboard**

A modern Next.js 15 application built for the Ministry of Finance of Indonesia, providing real-time financial data monitoring, reporting, and messaging within Indonesia's government financial management system.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.18-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Backend API running and reachable (see Configuration)

### Installation

```bash
npm install

# Create .env.local (see Configuration for required keys)
```

### Development

```bash
# Start development server with Turbopack (default)
npm run dev

# Start without Turbopack
npm run dev:no-turbo
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run dev:no-turbo` | Development without Turbopack |
| `npm run build` | Production build (8GB memory allocation) |
| `npm run build:analyze` | Build with bundle analyzer |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | ESLint with auto-fix |
| `npm run test` | Run Vitest (watch) |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Tests with Vitest UI |
| `npm run test:coverage` | Run tests with coverage (80% threshold) |
| `npm run clean` | Clean .next, dist, and coverage directories |
| `npm run install:clean` | Clean install via scripts/install-clean.js |
| `npm run analyze:bundle` | Analyze existing bundle |

## Technology Stack (Current)

### Core
- Next.js 15.5.9 App Router, React 19.2.3, TypeScript 5.9
- Node.js 18+ runtime

### UI
- Tailwind CSS v4 with shadcn/ui and Radix UI primitives
- Bootstrap + React Bootstrap in legacy or feature-specific UI
- motion/react primitives and framer-motion usage in animated UI
- Lucide icons, Sonner toasts, cmdk command palette

### Data and State
- TanStack React Query + devtools, TanStack Table
- Zustand for client state
- React Hook Form + Zod validation
- Axios HTTP clients with CSRF management and rate-limit UX handling

### Realtime
- Socket.IO client with typed events and presence

### Content and Files
- React Markdown + remark plugins, Shiki syntax highlighting
- PDF.js + react-pdf, XLSX export, QR code generation
- date-fns + moment utilities

### Testing and Quality
- Vitest + Testing Library (jsdom)
- ESLint with Next.js config

## Dependency Badges

Badges below are generated from package.json. When a dedicated logo is not available, the npm icon is used for consistency.

### Runtime Dependencies
[![@hookform/resolvers](https://img.shields.io/badge?label=%40hookform%2Fresolvers&message=%5E5.2.2&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@hookform/resolvers)
[![@radix-ui/react-alert-dialog](https://img.shields.io/badge?label=%40radix-ui%2Freact-alert-dialog&message=%5E1.1.15&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-alert-dialog)
[![@radix-ui/react-avatar](https://img.shields.io/badge?label=%40radix-ui%2Freact-avatar&message=%5E1.1.11&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-avatar)
[![@radix-ui/react-checkbox](https://img.shields.io/badge?label=%40radix-ui%2Freact-checkbox&message=%5E1.3.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-checkbox)
[![@radix-ui/react-dialog](https://img.shields.io/badge?label=%40radix-ui%2Freact-dialog&message=%5E1.1.15&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-dialog)
[![@radix-ui/react-dropdown-menu](https://img.shields.io/badge?label=%40radix-ui%2Freact-dropdown-menu&message=%5E2.1.16&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-dropdown-menu)
[![@radix-ui/react-hover-card](https://img.shields.io/badge?label=%40radix-ui%2Freact-hover-card&message=%5E1.1.15&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-hover-card)
[![@radix-ui/react-label](https://img.shields.io/badge?label=%40radix-ui%2Freact-label&message=%5E2.1.8&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-label)
[![@radix-ui/react-navigation-menu](https://img.shields.io/badge?label=%40radix-ui%2Freact-navigation-menu&message=%5E1.2.14&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-navigation-menu)
[![@radix-ui/react-popover](https://img.shields.io/badge?label=%40radix-ui%2Freact-popover&message=%5E1.1.15&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-popover)
[![@radix-ui/react-radio-group](https://img.shields.io/badge?label=%40radix-ui%2Freact-radio-group&message=%5E1.3.8&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-radio-group)
[![@radix-ui/react-scroll-area](https://img.shields.io/badge?label=%40radix-ui%2Freact-scroll-area&message=%5E1.2.10&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-scroll-area)
[![@radix-ui/react-select](https://img.shields.io/badge?label=%40radix-ui%2Freact-select&message=%5E2.2.6&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-select)
[![@radix-ui/react-separator](https://img.shields.io/badge?label=%40radix-ui%2Freact-separator&message=%5E1.1.8&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-separator)
[![@radix-ui/react-slot](https://img.shields.io/badge?label=%40radix-ui%2Freact-slot&message=%5E1.2.4&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-slot)
[![@radix-ui/react-switch](https://img.shields.io/badge?label=%40radix-ui%2Freact-switch&message=%5E1.2.6&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-switch)
[![@radix-ui/react-tabs](https://img.shields.io/badge?label=%40radix-ui%2Freact-tabs&message=%5E1.1.13&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-tabs)
[![@radix-ui/react-toggle](https://img.shields.io/badge?label=%40radix-ui%2Freact-toggle&message=%5E1.1.10&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-toggle)
[![@radix-ui/react-tooltip](https://img.shields.io/badge?label=%40radix-ui%2Freact-tooltip&message=%5E1.2.8&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@radix-ui/react-tooltip)
[![@tanstack/react-query](https://img.shields.io/badge?label=%40tanstack%2Freact-query&message=%5E5.90.12&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@tanstack/react-query)
[![@tanstack/react-query-devtools](https://img.shields.io/badge?label=%40tanstack%2Freact-query-devtools&message=%5E5.91.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@tanstack/react-query-devtools)
[![@tanstack/react-table](https://img.shields.io/badge?label=%40tanstack%2Freact-table&message=%5E8.21.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@tanstack/react-table)
[![@types/react-window](https://img.shields.io/badge?label=%40types%2Freact-window&message=%5E2.0.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@types/react-window)
[![axios](https://img.shields.io/badge?label=axios&message=%5E1.13.2&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/axios)
[![bootstrap](https://img.shields.io/badge?label=bootstrap&message=%5E5.3.8&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/bootstrap)
[![class-variance-authority](https://img.shields.io/badge?label=class-variance-authority&message=%5E0.7.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/class-variance-authority)
[![clsx](https://img.shields.io/badge?label=clsx&message=%5E2.1.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/clsx)
[![cmdk](https://img.shields.io/badge?label=cmdk&message=%5E1.1.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/cmdk)
[![cookie](https://img.shields.io/badge?label=cookie&message=%5E1.1.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/cookie)
[![date-fns](https://img.shields.io/badge?label=date-fns&message=%5E4.1.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/date-fns)
[![emoji-picker-react](https://img.shields.io/badge?label=emoji-picker-react&message=%5E4.16.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/emoji-picker-react)
![indo-finance-dashboard](https://img.shields.io/badge?label=indo-finance-dashboard&message=file%3A&color=CB3837&style=flat-square&logo=npm)
[![jose](https://img.shields.io/badge?label=jose&message=%5E6.1.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/jose)
[![lucide-react](https://img.shields.io/badge?label=lucide-react&message=%5E0.562.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/lucide-react)
[![moment](https://img.shields.io/badge?label=moment&message=%5E2.30.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/moment)
[![motion](https://img.shields.io/badge?label=motion&message=%5E12.23.26&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/motion)
[![next](https://img.shields.io/badge?label=next&message=%5E15.5.9&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/next)
[![next-themes](https://img.shields.io/badge?label=next-themes&message=%5E0.4.6&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/next-themes)
[![node-fetch](https://img.shields.io/badge?label=node-fetch&message=%5E3.3.2&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/node-fetch)
[![pdfjs-dist](https://img.shields.io/badge?label=pdfjs-dist&message=%5E5.4.449&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/pdfjs-dist)
[![react](https://img.shields.io/badge?label=react&message=%5E19.2.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react)
[![react-bootstrap](https://img.shields.io/badge?label=react-bootstrap&message=%5E2.10.10&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-bootstrap)
[![react-day-picker](https://img.shields.io/badge?label=react-day-picker&message=%5E9.13.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-day-picker)
[![react-dom](https://img.shields.io/badge?label=react-dom&message=%5E19.2.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-dom)
[![react-hook-form](https://img.shields.io/badge?label=react-hook-form&message=%5E7.69.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-hook-form)
[![react-markdown](https://img.shields.io/badge?label=react-markdown&message=%5E10.1.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-markdown)
[![react-pdf](https://img.shields.io/badge?label=react-pdf&message=%5E10.2.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-pdf)
[![react-qr-code](https://img.shields.io/badge?label=react-qr-code&message=%5E2.0.18&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-qr-code)
[![react-window](https://img.shields.io/badge?label=react-window&message=%5E2.2.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/react-window)
[![recharts](https://img.shields.io/badge?label=recharts&message=%5E3.6.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/recharts)
[![remark-breaks](https://img.shields.io/badge?label=remark-breaks&message=%5E4.0.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/remark-breaks)
[![remark-gfm](https://img.shields.io/badge?label=remark-gfm&message=%5E4.0.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/remark-gfm)
[![shadcn](https://img.shields.io/badge?label=shadcn&message=%5E3.6.2&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/shadcn)
[![shiki](https://img.shields.io/badge?label=shiki&message=%5E3.20.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/shiki)
[![socket.io-client](https://img.shields.io/badge?label=socket.io-client&message=%5E4.8.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/socket.io-client)
[![sonner](https://img.shields.io/badge?label=sonner&message=%5E2.0.7&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/sonner)
[![tailwind-merge](https://img.shields.io/badge?label=tailwind-merge&message=%5E3.4.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/tailwind-merge)
[![uuid](https://img.shields.io/badge?label=uuid&message=%5E13.0.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/uuid)
[![xlsx](https://img.shields.io/badge?label=xlsx&message=%5E0.18.5&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/xlsx)
[![zod](https://img.shields.io/badge?label=zod&message=%5E4.2.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/zod)
[![zustand](https://img.shields.io/badge?label=zustand&message=%5E5.0.9&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/zustand)

### Dev Dependencies
[![@eslint/eslintrc](https://img.shields.io/badge?label=%40eslint%2Feslintrc&message=%5E3.3.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@eslint/eslintrc)
[![@tailwindcss/postcss](https://img.shields.io/badge?label=%40tailwindcss%2Fpostcss&message=%5E4.1.18&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@tailwindcss/postcss)
[![@testing-library/jest-dom](https://img.shields.io/badge?label=%40testing-library%2Fjest-dom&message=%5E6.9.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@testing-library/jest-dom)
[![@testing-library/react](https://img.shields.io/badge?label=%40testing-library%2Freact&message=%5E16.3.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@testing-library/react)
[![@testing-library/user-event](https://img.shields.io/badge?label=%40testing-library%2Fuser-event&message=%5E14.6.1&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@testing-library/user-event)
[![@types/node](https://img.shields.io/badge?label=%40types%2Fnode&message=%5E24.10.4&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@types/node)
[![@types/react](https://img.shields.io/badge?label=%40types%2Freact&message=%5E19.2.7&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@types/react)
[![@types/react-dom](https://img.shields.io/badge?label=%40types%2Freact-dom&message=%5E19.2.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@types/react-dom)
[![@vitejs/plugin-react](https://img.shields.io/badge?label=%40vitejs%2Fplugin-react&message=%5E5.1.2&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/@vitejs/plugin-react)
[![cross-env](https://img.shields.io/badge?label=cross-env&message=%5E10.1.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/cross-env)
[![eslint](https://img.shields.io/badge?label=eslint&message=%5E9.39.2&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/eslint)
[![eslint-config-next](https://img.shields.io/badge?label=eslint-config-next&message=%5E16.1.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/eslint-config-next)
[![jsdom](https://img.shields.io/badge?label=jsdom&message=%5E27.3.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/jsdom)
[![rimraf](https://img.shields.io/badge?label=rimraf&message=%5E6.1.2&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/rimraf)
[![tailwindcss](https://img.shields.io/badge?label=tailwindcss&message=%5E4.1.18&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/tailwindcss)
[![tailwindcss-animate](https://img.shields.io/badge?label=tailwindcss-animate&message=%5E1.0.7&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/tailwindcss-animate)
[![typescript](https://img.shields.io/badge?label=typescript&message=%5E5.9.3&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/typescript)
[![vitest](https://img.shields.io/badge?label=vitest&message=%5E4.0.16&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/vitest)
[![webpack-bundle-analyzer](https://img.shields.io/badge?label=webpack-bundle-analyzer&message=%5E5.1.0&color=CB3837&style=flat-square&logo=npm)](https://www.npmjs.com/package/webpack-bundle-analyzer)

## Current Implementation Highlights

- Routing: App Router with public routes under `src/app/(public)` and protected routes enforced by `middleware.ts`.
- Auth: Session cookie `sid`, server validation via `/api/v1/auth/session`, IP block detection redirecting to `/ip-blocked`.
- HTTP: Axios `http` (same-origin) and `backendHttp` (direct) with CSRF manager, 401 handling, and rate-limit UX.
- State: React Query configs and query key factories (`src/lib/config/query-configs.ts`), Zustand stores for messaging, notifications, typing, and unread badges.
- Realtime: Socket event SSOT in `src/shared/socket-events.ts` (messaging, presence, notifications, handshake).
- Inquiry Data: SSOT filter registry, SQL preview, encrypted query payloads, and saved queries.
- RAG Chat: Next proxy routes under `src/app/api/v1/rag` with 180s timeout and streaming support; UI widget in `src/components/rag-chat`.
- Caching and perf: cache manager/metrics/warmer in `src/lib/cache`, performance utilities in `src/utils`, and Next.js `optimizePackageImports` + bundle analyzer.

## Project Structure

```
src/
|-- app/                     # App Router routes
|   |-- (public)/            # login, server-error, ip-blocked
|   |-- dashboard/           # utama, program, efisiensi
|   |-- inquiry-data/        # inquiry UI + exports
|   |-- makan-bergizi/        # MBG dashboard + kertas-kerja
|   |-- menu-rowset/          # dataset, sp2d, track-nadine
|   |-- messages/             # realtime messaging
|   |-- notifications/        # notifications
|   |-- users/                # user management
|   |-- settings/             # settings (new)
|   |-- pengaturan/           # settings (legacy)
|   |-- profile/              # user profile
|   |-- data-makrokesra/      # BPS / makro data
|   |-- data-supplier/        # supplier analytics
|   |-- epa/                  # EPA analytics
|   |-- monitor-performa/     # performance monitoring
|   |-- log-user/             # login/history logs
|   |-- satker/               # satker data
|   |-- transfer-daerah/      # regional transfers
|   |-- laporan/              # reporting pages
|   |-- tentang-kita/         # about page
|   |-- unauthorized/         # auth errors
|   |-- api/                  # Next route handlers + proxy routes
|-- components/               # UI components
|   |-- ui/                   # shadcn/ui base components
|   |-- auth/ dashboard/ messaging/ charts/ layout/
|   |-- inquiry-data/         # filters, query builder UI, exports
|   |-- rag-chat/             # RAG chat widget
|   |-- monitoring/           # performance dashboards
|   |-- animate-ui/           # motion/react primitives
|-- features/                 # feature modules (mbg, messaging, sp2d)
|-- hooks/                    # dashboard, inquiry, messaging, monitoring hooks
|-- services/                 # MessageService, FilterDataService, ...
|-- stores/                   # Zustand stores (messaging, notifications, typing, BPS)
|-- lib/                      # api, auth, cache, config, security, ui, utils
|-- shared/                   # socket events, rbac
|-- query-builders/           # SQL builder helpers
|-- contexts/                 # shared contexts
|-- data/                     # static datasets
|-- styles/                   # global styles
|-- types/                    # TypeScript types
|-- utils/                    # perf, rate limit, ip block, reconnection
```

Tests live in `test/` with setup in `src/test-setup.ts`.

## Configuration

### Environment Variables (used in code)

Core API and sockets:
- `API_URL`, `NEXT_PUBLIC_API_URL` - API base URL (server/client)
- `BACKEND_PORT`, `NEXT_PUBLIC_BACKEND_PORT` - backend port for proxying
- `NEXT_PUBLIC_BACKEND_ORIGIN` - override backend origin
- `NEXT_PUBLIC_SOCKET_ORIGIN`, `NEXT_PUBLIC_SOCKET_PATH` - Socket.IO connection
- `NEXT_PUBLIC_USE_ABSOLUTE_API` - set to `false` to force absolute API on client
- `NEXT_PUBLIC_HTTP_TIMEOUT_MS`, `NEXT_PUBLIC_BACKEND_HTTP_TIMEOUT_MS` - Axios timeouts
- `NEXT_PUBLIC_DEBUG_AUTH` - enable auth debug logs
- `NEXT_PUBLIC_COOKIE_DEV_SECURE` - allow secure cookies in dev

Feature-specific:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - MBG map search
- `NEXT_PUBLIC_NADINE`, `NEXT_PUBLIC_NADINE_KONSEP`, `NEXT_PUBLIC_NADINE_UPDATE_TOKEN`, `NEXT_PUBLIC_NADINE_DETAIL` - NADINE tracking
- `NEXT_PUBLIC_LOCAL_SOCKET_DANADESA` - local socket for NADINE tracking
- `CACHE_INVALIDATE_SECRET` - cache signature validation

Build flags:
- `ANALYZE` - enable bundle analyzer (`npm run build:analyze`)
- `HTTPS` - enable HSTS in production
- `CI` - ignore TS build errors in CI when true

## Features (Current)

1. Financial dashboards (utama, program, efisiensi) with charts and KPIs
2. Inquiry data builder with SSOT filter registry, SQL preview, saved queries, and export (CSV/XLSX/PDF)
3. MBG (Makan Bergizi) dashboards + kertas kerja with map integration
4. Real-time messaging with Socket.IO, typing indicators, presence, unread badges, and notifications
5. RAG chat widget with streaming backend proxy
6. Data supplier analytics, EPA, transfer daerah, satker, and monitoring pages
7. User management with RBAC and session-based protection

## Security Implementation

- Middleware enforces protect-by-default routing, session validation, and IP block handling.
- CSRF manager with caching and proactive refresh; attached to Axios requests.
- Security headers (CSP, HSTS when HTTPS enabled, X-Frame-Options, X-Content-Type-Options).
- Rate-limit UX handling and consistent error normalization.

## Real-time Architecture

- Socket event names and payloads defined in `src/shared/socket-events.ts`.
- Cache invalidation wired to React Query query keys.
- Reconnection logic and presence/typing indicators handled in hooks and utils.

## Testing

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

- 80% coverage thresholds enforced across branches/functions/lines/statements
- Test files live in `test/` and use `*.test.ts|tsx` suffix
- Shared setup in `src/test-setup.ts`

## Performance and Build Notes

- React Query cache presets: static, user, dashboard, realtime, critical, financial, search
- Image optimization for WebP and AVIF with minimum cache TTL
- Bundle analyzer via `npm run build:analyze`
- Build memory allocation: 8GB (`--max-old-space-size=8192`)
- Next.js output: `standalone` for Docker deployment

## Docker Deployment

```bash
# Build production image
docker build -t sintesa-frontend .

# Run with docker-compose (recommended)
docker-compose -f ../docker-compose.prod.yml up -d
```

- Dockerfile and Dockerfile.dev are included
- API requests are proxied to the backend service via Next rewrites

## Troubleshooting

1. Build memory issues: use `npm run build`
2. TypeScript errors: `npm run typecheck`
3. Linting errors: `npm run lint:fix`
4. Test failures: verify coverage thresholds and component tests

## License

This project is proprietary software developed for the Ministry of Finance of the Republic of Indonesia.

## Contributing

Please follow the established coding standards and testing requirements when contributing to this project.

---

Built for the Ministry of Finance of the Republic of Indonesia
