# Role-Based Access Control (RBAC) Implementation for Carisatker Search

## Overview

This implementation adds role-based access control to the carisatker (satker search) functionality based on the user's `kdkanwil` (Kanwil code). Users can only search and view satkers that are within their authorized kanwil area.

## Features Implemented

### 1. RBAC Utility Functions (`src/utils/satker-rbac.ts`)

- **`filterSatkerByUserAccess()`**: Filters satker data based on user's role and kdkanwil
- **`hasAccessToSatker()`**: Checks if user has access to a specific satker
- **`getUserAccessDescription()`**: Returns user-friendly description of access level

### 2. Updated Search Components

#### Satker Search Component (`src/components/layout/satker-search.tsx`)
- Integrates with user authentication
- Filters search results based on user's access level
- Shows kdkanwil information in search results

#### Satker Search Page (`src/app/satker/page.tsx`)
- Displays user's access level information
- Shows appropriate warnings for users without access
- Filters search results based on RBAC rules

#### Satker Detail Page (`src/app/satker/[kdsatker]/page.tsx`)
- Prevents access to satkers outside user's authorized kanwil
- Shows access denied message with appropriate actions
- Displays kdkanwil information for authorized satkers

### 3. Access Control Rules

| Role | Access Level | Description |
|------|-------------|-------------|
| `super_admin` | Full Access | Can view all satkers |
| `co_admin` | Full Access | Can view all satkers |
| `kantor_pusat` | Full Access | Can view all satkers |
| `kanwil_djpb` | Limited | Only satkers within same kdkanwil |
| `kppn` | Limited | Only satkers within same kdkppn |
| `lainnya` | No Access | Cannot view any satker data |

### 4. Demo Components

#### RBAC Demo Component (`src/components/demo/rbac-demo.tsx`)
- Shows current user's access level
- Displays kdkanwil information
- Explains access rules

#### Test RBAC Page (`src/app/test-rbac/page.tsx`)
- Comprehensive demonstration of RBAC functionality
- Shows access statistics
- Lists sample accessible satkers

## Data Structure

### User Object (from `src/lib/users-store.ts`)
```typescript
type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "super_admin" | "co_admin" | "kantor_pusat" | "kanwil_djpb" | "kppn" | "lainnya";
  kdkanwil?: string; // Kode Kanwil - key field for RBAC
  nmkanwil?: string; // Nama Kanwil
  kdkppn?: string;   // Kode KPPN - key field for KPPN role RBAC
  nmkppn?: string;   // Nama KPPN
  // ... other fields
}
```

### Satker Object (from `carisatker.json`)
```typescript
interface SatkerItem {
  kdsatker: string;  // Satker code
  nmsatker: string;  // Satker name
  kdkppn: string;    // KPPN code - key field for KPPN role RBAC matching
  kdkanwil: string;  // Kanwil code - key field for Kanwil role RBAC matching
}
```

## Implementation Details

### 1. Authentication Integration
- Uses `useCurrentUser()` hook to get current user information
- Integrates with existing authentication system
- Respects user loading states

### 2. Filtering Logic
The RBAC filtering works differently for each role:

```typescript
// For kanwil_djpb users - filter by kdkanwil
if (user.role === "kanwil_djpb" && user.kdkanwil) {
  return satkerData.filter(satker => satker.kdkanwil === user.kdkanwil);
}

// For kppn users - filter by kdkppn (more restrictive)
if (user.role === "kppn" && user.kdkppn) {
  return satkerData.filter(satker => satker.kdkppn === user.kdkppn);
}
```

### 3. UI/UX Enhancements
- Clear access level indicators
- Informative error messages
- Contextual help text
- Proper loading states
- Graceful degradation for unauthorized access

## Testing

### Test Scenarios
1. **Super Admin/Co-Admin**: Should see all satkers
2. **Kantor Pusat**: Should see all satkers
3. **Kanwil DJPb User**: Should only see satkers within their kdkanwil
4. **KPPN User**: Should only see satkers within their kdkppn (more restrictive than kdkanwil)
5. **Other Users**: Should see no satkers and appropriate messages

### Test Page
Visit `/test-rbac` to see a comprehensive demonstration of the RBAC functionality.

## Security Considerations

1. **Client-Side Filtering**: Current implementation filters on the client side. For production, consider server-side filtering for enhanced security.

2. **Token Validation**: Relies on existing authentication system for user validation.

3. **Access Logging**: Consider adding audit logs for access attempts.

## Future Enhancements

1. **Server-Side Filtering**: Move filtering logic to backend API
2. **Caching**: Implement caching for filtered results
3. **Audit Logging**: Add logging for access control decisions
4. **Fine-Grained Permissions**: Add more specific permission levels
5. **Dynamic Role Assignment**: Allow runtime role changes

## Files Modified/Created

### Modified Files
- `src/components/layout/satker-search.tsx`
- `src/app/satker/page.tsx`
- `src/app/satker/[kdsatker]/page.tsx`

### New Files
- `src/utils/satker-rbac.ts`
- `src/components/demo/rbac-demo.tsx`
- `src/app/test-rbac/page.tsx`
- `RBAC_IMPLEMENTATION.md`

## Usage Examples

### Basic Usage in Components
```typescript
import { useCurrentUser } from "@/lib/use-current-user";
import { filterSatkerByUserAccess } from "@/utils/satker-rbac";
import carisatkerData from "@/data/carisatker.json";

function MyComponent() {
  const { currentUser } = useCurrentUser();
  const accessibleSatkers = filterSatkerByUserAccess(carisatkerData, currentUser);
  
  // Use accessibleSatkers for search/display
}
```

### Checking Individual Satker Access
```typescript
import { hasAccessToSatker } from "@/utils/satker-rbac";

const canAccess = hasAccessToSatker(satkerItem, currentUser);
if (!canAccess) {
  // Show access denied message
}
```

This implementation provides a robust, user-friendly role-based access control system for the carisatker search functionality while maintaining good performance and user experience.