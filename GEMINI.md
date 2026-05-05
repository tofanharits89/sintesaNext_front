# SintesaNEx Frontend - Gemini CLI Guide

This document provides essential context and instructions for the SintesaNEx Frontend project, a modern Indonesian Government Finance Dashboard built for the Ministry of Finance.

## Project Overview

*   **Core Tech:** Next.js 15.5.9 (App Router), React 19.2.3, TypeScript 5.9.
*   **Styling:** Tailwind CSS v4 with shadcn/ui and Radix UI primitives.
*   **State Management:** TanStack React Query v5, Zustand v5.
*   **Real-time:** Socket.IO client with typed events (SSOT in `src/shared/socket-events.ts`).
*   **API:** Axios-based clients with CSRF management and rate-limit handling.
*   **Testing:** Vitest with React Testing Library (80% coverage threshold).

## Architecture & Conventions

### Routing & Protection
*   **Protect-by-Default:** All routes are protected unless explicitly added to `PUBLIC_ROUTES` in `src/config/routes.ts`.
*   **Middleware:** `middleware.ts` handles session validation (`sid` cookie) and IP block detection.
*   **Public Routes:** Found in `src/app/(public)/` (login, server-error, ip-blocked).

### Directory Structure
*   `src/app/`: Next.js App Router routes and layouts.
*   `src/components/`: UI components (feature-specific and generic `ui/`).
*   `src/features/`: Complex feature modules (e.g., `mbg`, `messaging`, `sp2d`).
*   `src/lib/`: Core libraries (API clients, auth logic, cache management, configs).
*   `src/shared/`: Single source of truth for socket events and RBAC.
*   `src/stores/`: Zustand stores for client-side state.
*   `test/`: Comprehensive test suite mirrored against `src/`.

### Coding Standards
*   **TypeScript:** Strict typing is enforced. Use `typecheck` before committing.
*   **Hooks:** Prefer custom hooks for complex logic (found in `src/hooks/`).
*   **Components:** Use shadcn/ui primitives for consistency. Follow the `animate-ui` pattern for motion.
*   **Events:** Always use constants from `SOCKET_EVENTS` for real-time communication.

## Key Commands

| Command | Purpose |
| :--- | :--- |
| `pnpm dev` | Start development server with Turbopack. |
| `pnpm build` | Production build (allocates 8GB memory). |
| `pnpm test` | Run Vitest in watch mode. |
| `pnpm test:coverage` | Run tests and verify 80% coverage threshold. |
| `pnpm typecheck` | Run TypeScript compiler checks. |
| `pnpm lint:fix` | Run ESLint and auto-fix issues. |
| `pnpm clean` | Remove build and coverage artifacts. |

## Development Workflow

1.  **Auth:** Ensure your backend API is reachable. Sessions are managed via the `sid` cookie.
2.  **Environment:** Copy `.env.example` to `.env.local`. Core variables include `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_ORIGIN`.
3.  **Testing:** New features MUST include tests in the `test/` directory. Maintain the 80% coverage standard.
4.  **UI:** Prioritize Tailwind CSS v4 utility classes. Avoid legacy Bootstrap unless modifying existing legacy components.

## Security
*   **CSRF:** Managed automatically by `src/lib/security/csrf-manager.ts`.
*   **IP Blocking:** Handled via middleware and `src/utils/ipBlock.ts`.
*   **Sensitive Data:** Never log session tokens or private user data.

---
*Last updated: April 2026*
