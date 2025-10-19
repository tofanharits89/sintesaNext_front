# API Migration Guide: Next.js Proxy to Direct Backend Communication

## Overview

This document describes the migration from using Next.js API routes as proxies to direct backend communication for the inquiry data API.

## Migration Summary

### Before (Proxy Architecture)
```
Frontend (React) → Next.js API Route (/api/inquiry-data/query) → Backend Express API (/api/v1/inquiry-data/query) → PostgreSQL
```

### After (Direct Communication)
```
Frontend (React) → Backend Express API (/api/v1/inquiry-data/query) → PostgreSQL
```

## Changes Made

### 1. Backend CORS Configuration ✅
- **File**: `backendNEx/src/config/cors.ts`
- **Changes**: Already properly configured for direct frontend access
- **Environment Variables**:
  - `CORS_ALLOWLIST=http://10.0.8.42:3000,http://localhost:3000,http://localhost:3001`
  - `FRONTEND_URL=http://10.0.8.42:3000`
  - `FRONTEND_URL_ALT=http://localhost:3000`

### 2. Frontend HTTP Client Enhancement ✅
- **File**: `frontendNEx/src/lib/httpClient.ts`
- **Changes**: Added `directBackendClient` for direct backend communication
- **Features**:
  - Dedicated axios instance with backend base URL
  - CSRF token handling for cross-origin requests
  - Authentication and error handling
  - Rate limiting and IP blocking protection

### 3. API Hook Migration ✅
- **File**: `frontendNEx/src/hooks/use-inquiry-data-api.ts`
- **Changes**: Updated all API calls to use `directBackendClient`
- **Functions Updated**:
  - `executeQuery()` → Uses `/api/v1/inquiry-data/query`
  - `downloadCSV()` → Uses `/api/v1/inquiry-data/query`
  - `downloadExcel()` → Uses `/api/v1/inquiry-data/query`
  - `previewConvertedQuery()` → Uses `/api/v1/inquiry-data/query/preview`
  - `testConnection()` → Uses `/api/v1/inquiry-data/query`

### 4. Proxy Route Deprecation ✅
- **File**: `frontendNEx/src/app/api/inquiry-data/query/route.ts`
- **Changes**: Added deprecation warnings and migration guidance
- **Features**:
  - Console warnings when deprecated routes are used
  - Response headers with deprecation notices
  - Clear migration instructions in error responses

### 5. Configuration Verification ✅
- **Files**: `frontendNEx/.env.local`, `frontendNEx/.env.example`
- **Status**: Already configured for direct backend access
- **Key Setting**: `NEXT_PUBLIC_API_URL=http://localhost:88/api/v1`

## Usage Instructions

### For Developers

#### Using the New Direct Backend Client

```typescript
import { directBackendClient } from "@/lib/httpClient";

// GET request
const result = await directBackendClient.get("/api/v1/inquiry-data/query");

// POST request
const data = await directBackendClient.post("/api/v1/inquiry-data/query", {
  encryptedQuery: "...",
  format: "json"
});
```

#### Using the Updated Hook

```typescript
import { useInquiryDataApi } from "@/hooks/use-inquiry-data-api";

const { executeQuery, downloadCSV, testConnection } = useInquiryDataApi();

// All methods now use direct backend communication automatically
const result = await executeQuery(filters, values, params);
```

### Testing the Migration

#### Browser Console Testing
```javascript
// Test direct backend API
await testDirectBackendAPI();

// Compare performance
await comparePerformance();
```

#### Manual Testing
1. Open the inquiry data page in your application
2. Try executing queries, downloading CSV/Excel files
3. Check browser console for any deprecation warnings
4. Verify all functionality works as expected

## Benefits of Direct Backend Communication

### Performance Improvements
- **Reduced Latency**: Eliminates the Next.js proxy hop
- **Faster Response Times**: Direct network path to backend
- **Lower Server Load**: Reduces processing on Next.js server

### Architectural Benefits
- **Simplified Architecture**: Fewer network hops
- **Better Error Handling**: Direct backend error responses
- **Improved Debugging**: Clearer request/response flow

### Security Benefits
- **Consistent CORS**: Proper cross-origin security
- **Unified Authentication**: Single authentication flow
- **CSRF Protection**: Proper cross-origin CSRF handling

## Troubleshooting

### Common Issues

#### CORS Errors
```
Access to fetch at 'http://localhost:88/api/v1/inquiry-data/query' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution**: Ensure backend CORS is properly configured:
1. Check `CORS_ALLOWLIST` environment variable
2. Verify `FRONTEND_URL` settings
3. Ensure backend server has CORS middleware enabled

#### Authentication Issues
```
401 Unauthorized or 403 Forbidden errors
```

**Solution**: Verify cookie configuration:
1. Ensure cookies are being sent with credentials
2. Check domain and path settings for cookies
3. Verify authentication tokens are valid

#### CSRF Token Issues
```
403 Forbidden with CSRF error
```

**Solution**: Check CSRF token handling:
1. Ensure CSRF tokens are being included in headers
2. Verify CSRF middleware configuration on backend
3. Check cookie domain settings

### Debugging Tools

#### Network Tab
- Check the Network tab in browser developer tools
- Verify requests are going directly to `http://localhost:88/api/v1/...`
- Look for CORS headers in responses

#### Console Logging
- Deprecation warnings will appear for old proxy routes
- New direct backend calls are logged with `[BackendHttp]` prefix
- Performance timing is logged for comparison

#### Test Utilities
```javascript
// Run comprehensive test
await testDirectBackendAPI();

// Performance comparison
await comparePerformance();
```

## Rollback Plan

If issues arise, you can temporarily rollback by:

1. **Revert Hook Changes**: Change `directBackendClient` back to `apiClient` in `use-inquiry-data-api.ts`
2. **Update URLs**: Change `/api/v1/...` back to `/inquiry-data/...` paths
3. **Monitor Logs**: Check for deprecation warnings to ensure rollback worked

## Future Steps

1. **Monitor Performance**: Track the performance improvements
2. **Remove Deprecated Routes**: After confirming everything works, remove the deprecated proxy routes
3. **Update Documentation**: Ensure all documentation reflects the new architecture
4. **Extend to Other APIs**: Consider migrating other API endpoints to direct communication

## Support

For questions or issues with this migration:
1. Check the browser console for error messages
2. Use the test utilities to diagnose problems
3. Verify environment variables are correctly set
4. Ensure both frontend and backend servers are running
