# Sintesa Sessions & Tokens — Implementation Guide

## Overview
Sintesa uses JWT access + refresh tokens in HTTP-only cookies, backed by a database `sessions` table plus Redis mappings to enforce single-session.

- Access token: 30 minutes (JWT exp + cookie)
- Refresh token: 7 days (JWT exp + cookie)
- Single-session per user: enforced by Redis keys
- CSRF: cookie + header, tied to access token hash

Key backend files:
- Tokens/cookies: `backendNEx/src/utils/jwt.ts`, `backendNEx/src/config/cookies.ts`
- Session policy: `backendNEx/src/config/sessionConfig.ts`
- Auth endpoints: `backendNEx/src/modules/auth/controllers/auth.controller.ts`
- Middleware (requests): `backendNEx/src/middleware/auth.ts`
- Session model: `backendNEx/src/models/Session.ts`

Key frontend files:
- Login form: `frontendNEx/src/components/auth/LoginFormSimplified.tsx`
- Next API proxy: `frontendNEx/src/app/api/auth/*/route.ts`
- Client: `frontendNEx/src/lib/auth/client.ts`, `frontendNEx/src/lib/httpClient.ts`
- Guard middleware: `frontendNEx/middleware.ts`
## Session Types, Timeouts, and Remember Me

Defined in `backendNEx/src/config/sessionConfig.ts`.

- Admin (super_admin, co_admin)
  - Access: 30m
  - Refresh: 7d
  - Inactivity: 30m
  - Absolute: 8h
  - Remember me: absolute doubled to 16h (inactivity remains 30m)

- Standard (default for non-admin)
  - Access: 30m
  - Refresh: 7d
  - Inactivity: 2h
  - Absolute: 16h

- Extended (non-admin remember me)
  - Access: 30m
  - Refresh: 7d
  - Inactivity: 4h
  - Absolute: 24h

Remember me behavior on login (`auth.controller.ts`):
- Admin users stay on admin policy; absolute timeout is doubled (8h → 16h).
- Non-admin users switch to extended policy; absolute timeout is doubled (24h → 48h effective).
- Inactivity windows are not doubled.
## Tokens, Cookies, and Redis Mappings

Cookies (`backendNEx/src/config/cookies.ts`):
- `access_token`: HttpOnly, 30m
- `refresh_token`: HttpOnly, 7d
- `XSRF-TOKEN`: CSRF cookie (readable by client)

Redis mappings (with `session:` prefix):
- `user_session:{userId}` → access token hash (current session)
- `token_active:{tokenHash}` → userId (this token is active)
- `user_refresh:{userId}` → refresh token hash (current refresh)

Single-session is enforced by requiring both access mappings to match. Login/refresh rotates mappings and invalidates previous ones.

## Lifecycle

### Login (POST /auth/login)
- Verify credentials → issue access+refresh JWTs → set HttpOnly cookies.
- Create DB record `sessions` with hashed tokens, `expires_at`, `last_activity`, `is_active=true`.
- Seed Redis mappings: `user_session`, `token_active`, `user_refresh`.
- Remember me logic applied (see above); CSRF token is tied to access token hash.
### Protected requests (Express middleware)
- Verify JWT (Authorization header first, fallback cookie).
- Enforce single-session via Redis mappings.
- Enforce absolute timeout: DB lookup by `token_hash`; if `expires_at <= now`, deactivate session and clear mappings.
- Enforce inactivity: if `now - last_activity >= inactivityTimeout`, deactivate session and clear mappings.
- If valid, extend Redis TTLs (sliding window) and update `last_activity` asynchronously.

### Refresh (POST /auth/refresh)
- Verify refresh JWT; check `user_refresh` mapping; fallback to DB session if missing.
- Strict enforcement:
  - Absolute timeout: blocked if `expires_at <= now` (session deactivated, mappings cleared).
  - Inactivity timeout: blocked if exceeded (session deactivated, mappings cleared).
- On success, rotate tokens, update DB hashes, re-seed Redis, re-issue cookies and CSRF.

### Logout (POST /auth/logout)
- Deactivate DB session by token hash; clear cookies, CSRF, and Redis mappings for the current session.
## Frontend Behavior

- Proactive refresh: the auth hook schedules refresh around 50% of token lifetime (~25m) to keep active tabs signed in.
- Axios interceptors auto-refresh on 401 via `/api/auth/refresh`; on failure, caches are cleared and user is redirected to login.
- Next middleware validates protected routes via `/api/auth/validate` using a short-lived in-memory cache to limit network overhead.
- Dev cookie behavior can be made prod-like with `NEXT_PUBLIC_COOKIE_DEV_SECURE=true` to avoid masking cookie issues.

## Enforcement Summary

- Inactivity timeouts (strict):
  - Admin: 30m
  - Standard: 2h
  - Extended: 4h
  - Enforced on protected requests and refresh.

- Absolute timeouts (strict):
  - Admin: 8h (16h with remember me)
  - Standard: 16h
  - Extended: 24h (48h effective with remember me doubling on login)
  - Enforced on protected requests and refresh.
## Security Notes

- CSRF: unified cookie+header model; refresh/login are CSRF-exempt to avoid circular refresh dependency.
- Secrets: `JWT_SECRET` and `JWT_REFRESH_SECRET` must be distinct and ≥32 chars.
- Single-session mapping prevents token re-use across devices; older sessions are proactively invalidated on login/refresh.

## Configuration Knobs

- JWT TTLs (env overrides): `JWT_ACCESS_TTL` (default 30m), `JWT_REFRESH_TTL` (default 7d)
- Cookie flags: `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_FORCE_SECURE_DEFAULT`
- Session policy: `sessionConfig.ts` (per-type inactivity and absolute timeouts)
- Single-session control: `AUTH_SINGLE_SESSION=1`, `AUTH_BLOCK_CONCURRENT_LOGIN=1`

## References

- Policy: `backendNEx/src/config/sessionConfig.ts`
- Middleware checks: `backendNEx/src/middleware/auth.ts`
- Refresh enforcement: `backendNEx/src/modules/auth/controllers/auth.controller.ts`
- Login remember me: `backendNEx/src/modules/auth/controllers/auth.controller.ts`
- Frontend remember me: `frontendNEx/src/components/auth/LoginFormSimplified.tsx`, `frontendNEx/src/app/api/auth/login/route.ts`
