# Settings/Pengaturan Access Issue - Solution Guide

## Problem Summary
Shifu, you can't access the settings/pengaturan page because of Role-Based Access Control (RBAC) restrictions. The current RBAC configuration only allows `super_admin` and `co_admin` roles to access settings.

## Available Test Accounts
Here are the test accounts available in your system:

| Username | Password | Role | Settings Access |
|----------|----------|------|----------------|
| admin | admin123 | Super Admin | ✅ YES |
| coadmin | admin123 | Co-Admin | ✅ YES |
| kantorpusat | user123 | Kantor Pusat | ❌ NO |
| kanwil | user123 | Kanwil DJPb | ❌ NO |
| kppn | user123 | KPPN | ❌ NO |
| user | user123 | User Lainnya | ❌ NO |

## Current RBAC Configuration
In `/src/lib/rbac.ts`, the permissions are set as:

```typescript
export const PERMISSIONS = {
  super_admin: {
    settings: { view: true, edit: true },
    // ... other permissions
  },
  co_admin: {
    settings: { view: true, edit: false },
    // ... other permissions
  },
  kantor_pusat: {
    settings: { view: false, edit: false }, // ❌ BLOCKED
    // ... other permissions
  },
  // Other roles also have settings.view: false
};
```

## Solutions

### Solution 1: Login with Admin Account (Quick Fix)
1. Go to http://localhost:3000
2. Login with:
   - **Username:** `admin`
   - **Password:** `admin123`
3. You'll have full access to settings as super_admin

### Solution 2: Login with Co-Admin Account
1. Login with:
   - **Username:** `coadmin` 
   - **Password:** `admin123`
2. You'll have view access to settings as co_admin

### Solution 3: Modify RBAC Permissions (Recommended)
Update the RBAC configuration to allow other roles to access settings:

1. Edit `/src/lib/rbac.ts`
2. Change the permissions for roles you want to grant access:

```typescript
// Example: Allow Kantor Pusat to view settings
kantor_pusat: {
  settings: { view: true, edit: false }, // ✅ ALLOW VIEW
  // ... other permissions
},

// Example: Allow all roles to view settings
kanwil_djpb: {
  settings: { view: true, edit: false }, // ✅ ALLOW VIEW
  // ... other permissions
},
kppn: {
  settings: { view: true, edit: false }, // ✅ ALLOW VIEW
  // ... other permissions
},
lainnya: {
  settings: { view: true, edit: false }, // ✅ ALLOW VIEW
  // ... other permissions
}
```

## How the Pengaturan Page Works
1. `/app