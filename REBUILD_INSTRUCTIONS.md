# Frontend Rebuild Instructions

## The Issue
The frontend is still using old code that doesn't read the `socketToken` cookie. You need to rebuild the frontend with the updated authentication utilities.

## Steps to Fix

### 1. Stop Current Frontend Server
If the frontend dev server is running, stop it (Ctrl+C in the terminal).

### 2. Rebuild Frontend
```powershell
cd d:\frontendNEx
npm run build
```

### 3. Start Frontend Server
```powershell
npm start
```

Or for development:
```powershell
npm run dev
```

### 4. Test Login Flow
1. Clear browser cookies (important!)
2. Go to `http://10.0.8.42:3000/login`
3. Login with credentials
4. Check browser DevTools → Application → Cookies
5. You should see THREE cookies:
   - `accessToken` (httpOnly: true)
   - `refreshToken` (httpOnly: true)  
   - `socketToken` (httpOnly: false) ← **This is the new one!**
6. Navigate to dashboard
7. Check browser console - Socket.IO should connect successfully

## What Changed

### Backend (Already Done ✅)
- Added `socketToken` cookie (non-httpOnly) for Socket.IO authentication
- Kept `accessToken` (httpOnly) for HTTP requests

### Frontend (Needs Rebuild)
- Updated `src/utils/auth-utils.ts` to read `socketToken` first
- Socket.IO will now get the token from `socketToken` cookie

## Verification
After rebuild, check the browser console. You should see:
- ✅ Socket.IO connection successful
- ✅ No "NO_TOKEN" errors in backend logs
- ✅ Dashboard loads without authentication issues

## Troubleshooting

### If Socket.IO Still Fails:
1. **Clear all browser cookies** completely
2. **Hard refresh** the page (Ctrl+Shift+R)
3. **Check cookies** in DevTools - ensure `socketToken` exists
4. **Check backend logs** - should see token extraction from `socket:cookie:socketToken`

### If CSRF Errors Persist:
1. Clear browser cache
2. Restart both frontend and backend
3. Try in incognito/private browsing mode
