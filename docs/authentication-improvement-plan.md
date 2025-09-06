# Authentication Improvement Plan

Author: Augment Agent
Last updated: 2025-09-05
Scope: backendNEx authentication and authorization system

## 1) Objectives

- Raise security to industry best practices while preserving UX
- Reduce risk from token leakage and DB compromise
- Improve performance and scalability for multi-instance deployments
- Consolidate JWT utilities and remove drift
- Make behavior explicit (config, lifetimes, logging)

## 2) Current State Summary (Key Findings)

- Hybrid stateful JWT: access + refresh tokens with DB session gate (good)
- Session expiry not extended on refresh, causing inconsistent lifetimes
- Tokens sent in JSON responses while also set as httpOnly cookies
- Token accepted via query param (leak risk)
- Fingerprint bound to XFF+UA but no trust proxy guarantee; not enforced on access path
- Dev default JWT secrets in code; no fail-fast in prod
- Logging token prefixes
- Password policy minimal; bcrypt cost = 10
- Sessions store raw tokens and lack indexes on token columns
- Two JWT utility modules with differing semantics (drift)
- Rate limiting and caches are in-memory (non-distributed)

## 3) Principles and Target End-State

- One canonical JWT utility; separate secrets for access and refresh; consistent iss/aud
- Cookies OR JSON tokens, not both (prefer httpOnly, Secure cookies for browsers)
- No tokens in URLs, logs, or persistent JS-accessible storage
- Sessions store token hashes only; server-side revocation is authoritative
- Clear lifetime model: access short-lived; refresh rotates; session lifetime extended on refresh (or capped by absolute max)
- Defense in depth: per-user lockouts, stronger passwords, optional 2FA for privileged roles
- Distributed-ready: shared stores for rate limits/caches when scaling out

## 4) Prioritized Backlog

### Week 1 (Quick Wins)

1. Extend session.expires_at on refresh and auto-refresh paths
2. Choose one transport: stop returning tokens in JSON if using cookies
3. Disable token-in-query in production (ideally entirely)
4. Remove token material from logs
5. Fail-fast when JWT secrets are missing in production

### Week 2–3 (Security + Performance)

6. Store only SHA-256 hashes of tokens in sessions; add indexes on token_hash fields
7. Implement per-user login backoff/lockout using login_attempts/locked_until
8. Increase bcrypt cost to 12 and enforce stronger password policy
9. Configure trust proxy; refine fingerprinting (optional) using req.ip/req.ips and UA
10. Consolidate JWT utilities (remove drift, one error taxonomy)

### Week 4+ (Strategic Hardening)

11. Refresh token reuse detection and family tracking; revoke on reuse
12. Optional: switch to RS256 with key rotation plan
13. CSRF protection if SameSite requires relaxation; otherwise keep SameSite=strict
14. Move rate-limiter/caches to Redis or similar in multi-instance deployments
15. Authorization growth path: data-driven/cached RBAC if needed

## 5) Technical Changes

### 5.1 Extend session expiry on refresh

- Update refresh endpoint and middleware auto-refresh to also set `expires_at = now + ACCESS_TOKEN_EXPIRY` (or your chosen session TTL).

### 5.2 Cookies only (for web clients)

- Keep httpOnly, Secure cookies with SameSite strict/lax; remove access/refresh tokens from JSON responses to reduce XSS risk.

### 5.3 Disable query token

- Remove query extraction in production; optionally keep behind a development flag.

### 5.4 Remove token logging

- Do not log token length/prefix; only log userId/sessionId and outcome.

### 5.5 Fail-fast secrets

- On startup in non-development, throw if JWT secrets are missing.

### 5.6 Store token hashes (DB + code)

- Schema changes (see Migrations). Compute `sha256(token)` before persistence; query by hash.
- Benefits: indexes on fixed-length CHAR(64), reduced blast radius.

### 5.7 Per-user lockout/backoff

- Increment `login_attempts` on failures; after N attempts, set `locked_until` with exponential backoff; reset on success.

### 5.8 Password policy and bcrypt cost

- Increase bcrypt salt rounds to 12; enforce length ≥ 12 and multiple character classes; optionally check against breached lists.

### 5.9 Trust proxy and fingerprinting

- `app.set('trust proxy', true)` behind a trusted proxy. Prefer `req.ip/req.ips`. Keep fingerprint for refresh binding; consider loose access-time checks.

### 5.10 Consolidate JWT utilities

- Merge jwt-optimized.js and token-validator.js into one module:
  - Separate ACCESS_SECRET and REFRESH_SECRET
  - Common claim set; single error taxonomy
  - Helpers: generate/verify access & refresh; extract from request; refresh token flow

### 5.11 Refresh token reuse detection

- Track refresh token families (jti). On refresh, rotate and invalidate previous; if an old token is presented, revoke the session and alert.

### 5.12 Optional RS256 with rotation

- Use asymmetric keys with kid headers; maintain JWKS; rotate keys routinely.

## 6) Database Migrations (Sessions)

Goal: move from storing raw tokens to storing hashes.

- Add columns:
  - `token_hash CHAR(64) NOT NULL`
  - `refresh_token_hash CHAR(64)`
  - Indexes on `(token_hash)`, `(refresh_token_hash)`
- Backfill:
  - For each session row, compute SHA-256 of existing tokens and populate the hash columns
- Code rollout:
  - Write code to read by hash first; continue writing both raw and hash for a short window
  - After verification, stop writing raw tokens
- Cleanup:
  - Drop raw `token` and `refresh_token` columns when safe

Example SQL (MySQL-compatible; adjust types/constraints as needed):

```sql
ALTER TABLE sessions ADD COLUMN token_hash CHAR(64) AFTER token;
ALTER TABLE sessions ADD COLUMN refresh_token_hash CHAR(64) AFTER refresh_token;
CREATE INDEX idx_sessions_token_hash ON sessions (token_hash);
CREATE INDEX idx_sessions_refresh_token_hash ON sessions (refresh_token_hash);
-- Backfill (run with app offline or in a controlled migration step)
-- Pseudocode: UPDATE sessions SET token_hash = SHA2(token, 256), refresh_token_hash = SHA2(refresh_token, 256);
```

## 7) Configuration Changes

- Required env in production:
  - JWT_SECRET, JWT_REFRESH_SECRET (or RS256 key pair)
  - JWT_ISSUER, JWT_AUDIENCE
  - JWT_ACCESS_EXPIRES (e.g., 15m–8h) and JWT_REFRESH_EXPIRES (e.g., 7d)
  - RATE_LIMIT store (e.g., Redis URL) for distributed deployments
  - TRUST_PROXY=true (when behind reverse proxy)
- Centralize config and throw on missing required variables (prod).

## 8) Security Considerations

- Removing tokens from JSON eliminates a primary XSS persistence vector
- Hashing tokens reduces replay/lateral movement after DB compromise
- Lockouts reduce online brute force risk; consider 2FA for admins
- Disabling token-in-query closes logging/referrer leaks
- Separate secrets for access/refresh reduce key reuse blast radius

## 9) Rollout Plan and Feature Flags

- Introduce flags:
  - `AUTH_COOKIES_ONLY`
  - `AUTH_DISABLE_QUERY_TOKEN`
  - `AUTH_HASHED_SESSIONS`
- Phased rollout:
  1. Ship cookie-only + disable query token + no token logging (+ fail-fast secrets)
  2. Deploy hashed sessions in write-through mode (write raw+hash; read raw, prefer hash)
  3. Switch reads to hash; remove raw writes; monitor
  4. Migrate and drop raw columns

## 10) Test Plan (Add/Update Tests)

- Session refresh extends `expires_at` and requests succeed past initial 8h
- Tokens not present in JSON response when cookies enabled; cookies have httpOnly, Secure, SameSite
- Token in query rejected in production
- Session lookups by token hash; indexes used
- Lockout/backoff works and resets on success
- Auto-refresh updates cookies and session tokens; old refresh invalid
- Secrets missing in prod cause startup failure

## 11) Acceptance Criteria

- No tokens in JSON responses (when cookies enabled)
- Query token disabled in prod
- Session refresh reliably extends server-side session validity
- Sessions table uses hashes; raw token columns removed
- Password policy and bcrypt cost enforced
- Unified JWT module used across middleware/controllers

## 12) Observability

- Metrics: login success/failure, lockouts, refresh success/failure, reuse detections
- Logs: userId/sessionId, reason codes (no token, expired, revoked), no token material
- Dashboards: session counts (total/active/valid), cache hit/miss, rate-limit events

## 13) Risks & Mitigations

- Breaking clients relying on JSON tokens → communicate, grace period, feature flag
- Migration complexity for token hashing → staged rollout, dual-write/dual-read
- Increased CPU with bcrypt cost 12 → monitor, autoscale

## 14) Timeline (Indicative)

- Week 1: Items 1–5
- Weeks 2–3: Items 6–10
- Weeks 4+: Items 11–15

## 15) Appendices

### A) Sample code snippets (pseudocode)

Extend session expiry on refresh:

```js
await SessionService.updateSession(session.id, {
  token: newAccessToken,
  refresh_token: newRefreshToken,
  last_activity: new Date(),
  expires_at: new Date(Date.now() + ACCESS_TTL_MS),
});
```

Compute token hash (Node):

```js
import crypto from "crypto";
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
```

Enforce secrets (startup):

```js
if (process.env.NODE_ENV !== "development") {
  ["JWT_SECRET", "JWT_REFRESH_SECRET"].forEach((k) => {
    if (!process.env[k]) throw new Error(`${k} is required in production`);
  });
}
```
