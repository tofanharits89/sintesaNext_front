# Socket Connection Troubleshooting Guide

## If You Still See "Connection Timeout" Errors

### Step 1: Enable Debug Logging
Add to your environment or browser console:
```javascript
// In browser console during testing
localStorage.setItem('socket-debug', 'true');
window.location.reload();
```

This will show detailed socket debug logs in the console.

### Step 2: Check These Common Issues

| Problem | Symptom | Solution |
|---------|---------|----------|
| **Backend Slow** | Timeout after 15s, no connect error | Increase timeout to 20000ms in `.env` |
| **Network Latency** | Timeout varies, happens on weak networks | Same as above, or check network in DevTools |
| **Auth Middleware Slow** | Timeout always ~10-15s | Check backend socket auth handler performance |
| **Rate Limiting** | "Rate limit exceeded" errors | Check backend rate limit middleware |
| **IP Blocking** | Connection immediately rejected | Check if your IP was rate-limited |

### Step 3: Monitor in Browser DevTools

1. Open **DevTools → Console**
2. Look for these logs:

✅ **Good signs:**
```
[SocketClient] Socket connected successfully
[SocketClient] Connection already in progress, returning pending promise
```

❌ **Bad signs:**
```
[SocketClient] Connection timeout after 15000ms
[SocketClient] Connection error: Error
Multiple concurrent connect attempts visible
```

### Step 4: Check Backend Logs

Look in your backend logs for:
```
User connected: <username> (socket-id)
```

If you see multiple connection attempts for same user rapidly, the fix didn't work.
You should see only ONE successful connection per user session.

### Step 5: Verify Fixes Are in Place

Check these files exist with the fixes:

**File 1: socket-client.ts**
```bash
# Should contain these lines:
grep -n "isConnecting" src/lib/socket-client.ts
grep -n "connectPromise" src/lib/socket-client.ts
grep -n "timeout: config.timeout ?? 15000" src/lib/socket-client.ts
```

**File 2: useUnifiedSocket.ts**
```bash
# Should contain these lines:
grep -n "globalInitLock" src/hooks/useUnifiedSocket.ts
grep -n "Connection already in progress" src/hooks/useUnifiedSocket.ts
```

---

## Advanced Debugging

### Enable Full Socket.IO Debug
```javascript
// In browser console before connection attempt
localStorage.setItem('debug', '*');
window.location.reload();
```

### Test Connection Manually
```javascript
// In browser console
const { socketClient } = await import('./src/lib/socket-client.ts');
await socketClient.connect();
console.log('Connected:', socketClient.isConnected());
```

### Monitor Concurrent Attempts
```javascript
// Monkey-patch to see concurrent attempts
const original = socketClient.connect.bind(socketClient);
socketClient.connect = async function() {
  console.log('Connect called, isConnecting:', this.isConnecting);
  return original();
};
```

---

## Backend Diagnostics

### Check Socket Server Logs
```bash
# In backend directory
tail -f logs/combined-*.log | grep -i socket
```

### Verify Middleware Order
Backend socket handlers should execute in order:
1. IP Blocking check
2. Authentication 
3. Rate limiting
4. User connection tracking

If middleware is slow, socket will timeout.

### Test Backend Socket Directly
```bash
# From backend directory
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:88', {
  transports: ['websocket'],
  timeout: 20000
});
socket.on('connect', () => console.log('✓ Connected'));
socket.on('connect_error', e => console.log('✗ Error:', e));
"
```

---

## Performance Checklist

After applying fixes, verify:

- [ ] Only ONE socket per user session
- [ ] No duplicate event listeners
- [ ] Connection takes <5s on good networks
- [ ] No memory leaks during navigation
- [ ] Console shows no duplicate logs
- [ ] Backend logs show one "User connected" per session
- [ ] No race condition errors

---

## If Nothing Works

1. **Clear browser cache and localStorage**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Check backend socket initialization**
   - Ensure `initializeSocket()` is called once
   - Check CORS settings allow your domain
   - Verify socket.io path matches `/socket.io`

3. **Test with simple curl/socket.io-client**
   - Isolate the issue to app vs. backend

4. **Check network throttling**
   - DevTools → Network → Throttle to "Slow 3G"
   - See if timeout is timeout-specific

5. **Review recent changes**
   - Check git diff for socket-related changes
   - Revert suspect changes and test

---

## Performance Optimization

To further improve socket performance:

1. **Reduce payload size**
   - Don't send unnecessary data in socket events

2. **Batch operations**
   - Group multiple events into single emission

3. **Use compression**
   - Enable Socket.IO compression in config

4. **Optimize backend auth**
   - Cache token validation
   - Use Redis for session lookups

5. **Monitor connection metrics**
   - Track latency, reconnection counts
   - Alert if timeout errors spike

---

## Getting Help

If you need help debugging, collect this info:

1. Browser console logs (screenshot)
2. Backend socket logs (last 50 lines)
3. Network tab from DevTools (connection attempt)
4. Current timeout value and when it happens
5. How many components using `useUnifiedSocket()`

Then review `SOCKET_FIXES_GUIDE.md` and `SOCKET_FIXES_APPLIED.md`.
