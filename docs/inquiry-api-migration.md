# Inquiry Data API Migration Guide

## Overview

This document describes the migration of the inquiry data API from using Next.js proxy routes to direct backend communication.

## Migration Summary

### Before (Next.js Proxy)
```
Frontend (React) → Next.js API Route (/api/inquiry-data/query) → Backend Express API (/api/v1/inquiry-data/query) → PostgreSQL
```

### After (Direct Backend)
```
Frontend (React) → Backend Express API (/api/v1/inquiry-data/query) → PostgreSQL
```

## Changes Made

### 1. Backend CORS Configuration ✅
- **File**: `backendNEx/src/config/cors.ts`
- **Status**: Already configured
- **Details**: Backend CORS is properly configured to allow direct frontend requests with:
  - Environment-based allowlist via `CORS_ALLOWLIST`
  - Frontend URL configuration via `FRONTEND_URL` and `FRONTEND_URL_ALT`
  - Localhost access in development
  - Private network access for office/internal deployments
  - Proper credential support for cookies

### 2. Frontend HTTP Client Enhancement ✅
- **File**: `frontendNEx/src/lib/httpClient.ts`
- **Changes**: Added `directBackendClient` for direct backend communication
- **Features**:
  - Dedicated axios instance pointing to backend URL
  - CSRF token handling via cookies
  - Authentication and refresh token logic
  - Error handling and IP block detection
  - Rate limiting support

### 3. API Hook Updates ✅
- **File**: `frontendNEx/src/hooks/use-inquiry-data-api.ts`
- **Changes**: Updated all functions to use `directBackendClient`
- **Functions Updated**:
  - `executeQuery()` - Now calls `/api/v1/inquiry-data/query` directly
  - `downloadCSV()` - Direct backend communication for CSV downloads
  - `downloadExcel()` - Direct backend communication for Excel exports
  - `previewConvertedQuery()` - Simplified to use direct backend client
  - `testConnection()` - Updated to test direct backend connection

### 4. Configuration Files ✅
- **Files**: `frontendNEx/.env.local`, `frontendNEx/.env.example`
- **Status**: Already configured with correct backend URL (`http://localhost:88/api/v1`)
- **Details**: No changes needed as configuration was already pointing to backend

### 5. Proxy Route Deprecation ✅
- **File**: `frontendNEx/src/app/api/inquiry-data/query/route.ts`
- **Changes**: Added deprecation warnings and migration guidance
- **Features**:
  - Console warnings when proxy route is used
  - Response headers with deprecation notices
  - Migration guide in error responses
  - Backward compatibility maintained for now

## Usage Examples

### Old Way (Proxy Route)
```typescript
import { apiClient } from "@/lib/httpClient";

// Execute query via proxy
const result = await apiClient.post("/inquiry-data/query", {
  encryptedQuery,
  format: "json",
  page: 1,
  pageSize: 50
});
```

### New Way (Direct Backend)
```typescript
import { directBackendClient } from "@/lib/httpClient";

// Execute query directly
const result = await directBackendClient.post("/api/v1/inquiry-data/query", {
  encryptedQuery,
  format: "json",
  page: 1,
  pageSize: 50
});
```

## Benefits of Migration

### 1. **Reduced Latency**
- Eliminates Next.js proxy hop
- Fewer network round trips
- Faster response times

### 2. **Simplified Architecture**
- Direct frontend-backend communication
- Fewer components to maintain
- Cleaner request flow

### 3. **Better Error Handling**
- Direct backend error responses
- More accurate error reporting
- Better debugging capabilities

### 4. **Improved Performance**
- Less processing overhead
- Better resource utilization
- Improved scalability

## Testing

### Automated Testing
```typescript
import { testDirectBackendAPI, comparePerformance } from "@/utils/test-direct-backend-api";

// Run migration tests
await testDirectBackendAPI();

// Compare performance
await comparePerformance();
```

### Manual Testing
1. Start both frontend and backend servers
2. Open browser developer console
3. Run: `testDirectBackendAPI()`
4. Check that all tests pass
5. Run: `comparePerformance()` to see performance improvement

## Troubleshooting

### CORS Issues
**Problem**: Browser shows CORS errors
**Solution**: Check backend CORS configuration in `backendNEx/.env`:
```bash
CORS_ALLOWLIST=http://localhost:3000,http://10.0.8.42:3000
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_ALT=http://10.0.8.42:3000
```

### Authentication Issues
**Problem**: 401 Unauthorized errors
**Solution**: Ensure cookies are being sent:
- Check that `withCredentials: true` is set
- Verify backend is reachable from frontend
- Check that authentication cookies exist

### CSRF Issues
**Problem**: 403 Forbidden with CSRF errors
**Solution**: Verify CSRF token handling:
- Check that XSRF-TOKEN cookie exists
- Ensure X-CSRF-Token header is being sent
- Verify backend CSRF configuration

### Network Issues
**Problem**: Connection refused or timeout errors
**Solution**: Check network connectivity:
- Verify backend server is running on port 88
- Check firewall settings
- Ensure correct backend URL in environment variables

## Rollback Plan

If issues arise and you need to rollback:

1. **Update API Hook**
   ```typescript
   // Revert to using apiClient instead of directBackendClient
   const result = await apiClient.post("/inquiry-data/query", data);
   ```

2. **Keep Proxy Route**
   - The deprecated proxy route remains functional
   - Remove deprecation warnings if needed

3. **Verify Functionality**
   - Test all inquiry data features
   - Ensure CSV/Excel downloads work
   - Verify query preview functionality

## Future Considerations

### Complete Proxy Removal
- Once migration is verified stable, completely remove proxy routes
- Update any other parts of application that might use proxy routes
- Clean up any unused proxy-related code

### Security Enhancements
- Consider implementing additional security measures for direct backend calls
- Monitor for any new security considerations with direct communication
- Update security documentation

### Performance Monitoring
- Monitor API performance improvements
- Track any new error patterns
- Document performance gains for future reference

## Support

For questions or issues with this migration:

1. Check the troubleshooting section above
2. Review browser console for detailed error messages
3. Verify backend and frontend server logs
4. Test using the provided test utilities
5. Compare with the old proxy implementation if needed

---

**Migration completed on**: October 19, 2025  
**Status**: ✅ Complete and tested  
**Next steps**: Monitor in production, consider complete proxy removal after stability verification