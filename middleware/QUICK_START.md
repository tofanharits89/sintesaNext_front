# Middleware Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Understand the Structure (30 seconds)

```
middleware/
├── config.ts          # All configuration here
├── cache/             # Caching logic
├── services/          # Business logic
├── handlers/          # Request handling
└── utils/             # Helper functions
```

### 2. Common Tasks

#### Add a New Configuration Option

```typescript
// In middleware/config.ts
export const MiddlewareConfig = {
  // ... existing config
  myNewSetting: process.env.MY_NEW_SETTING || "default",
} as const;
```

#### Create a New Service

```typescript
// In middleware/services/MyNewService.ts
import { CacheManager } from "../cache/CacheManager";
import { MiddlewareConfig } from "../config";

export class MyNewService {
  constructor(private cacheManager: CacheManager) {}

  async myMethod() {
    // Your logic here
  }
}
```

```typescript
// In middleware.ts - use the new service
import { MyNewService } from "./middleware/services/MyNewService";

const myService = new MyNewService(cacheManager);
```

#### Add a New Utility Function

```typescript
// In middleware/utils/MyUtils.ts
export class MyUtils {
  static myHelper(input: string): string {
    // Your logic here
    return input.toUpperCase();
  }
}
```

#### Modify Authentication Logic

```typescript
// In middleware/handlers/AuthenticationHandler.ts
// Find the relevant method and modify it
async handleLoginPage(request: NextRequest, rawCookie: string, hasAccessToken: boolean) {
  // Your modifications here
}
```

### 3. Debug Mode

Enable detailed logging:

```bash
# In .env.local
NEXT_PUBLIC_DEBUG_AUTH=1
```

Check console for:
- `[Auth]` - Authentication decisions
- `[Middleware]` - Cache operations
- `[Health]` - Backend health checks

### 4. Testing Your Changes

```typescript
// Test individual component
import { CacheManager } from './middleware';

const cache = new CacheManager();
cache.set('test', { ok: true, exp: Date.now() + 10000 });
console.log(cache.get('test')); // Should return the entry
```

### 5. Common Scenarios

#### Scenario 1: Change Session TTL

```typescript
// In middleware/config.ts
export const MiddlewareConfig = {
  sessionVerifyTtl: 30_000, // Change from 15s to 30s
  // ...
};
```

#### Scenario 2: Add New Public Path

```typescript
// In middleware/config.ts
export const PathConfig = {
  public: ["/login", "/api/auth", "/my-new-public-path"],
  // ...
};
```

#### Scenario 3: Customize Redirect Logic

```typescript
// In middleware/handlers/AuthenticationHandler.ts
handleRootPath(request: NextRequest, isAuth: boolean): NextResponse | null {
  const relPath = PathUtils.getRelativePath(request.nextUrl.pathname);
  
  if (relPath !== "/") {
    return null;
  }

  const url = request.nextUrl.clone();
  // Customize redirect destination
  url.pathname = isAuth ? "/my-custom-dashboard" : "/login";
  return NextResponse.redirect(url);
}
```

#### Scenario 4: Add Custom Header

```typescript
// In middleware/handlers/AuthenticationHandler.ts
createAuthenticatedResponse(request: NextRequest, isPublicPath: boolean, isAuth: boolean, hasAccessToken: boolean): NextResponse {
  // ... existing code ...
  
  // Add your custom header
  res.headers.set("x-my-custom-header", "my-value");
  
  return res;
}
```

## 📚 Key Concepts

### Dependency Injection

Services are injected, not created inside:

```typescript
// ✅ Good - Dependency injection
class MyHandler {
  constructor(private sessionService: SessionValidationService) {}
}

// ❌ Bad - Creating dependencies inside
class MyHandler {
  private sessionService = new SessionValidationService();
}
```

### Single Responsibility

Each class does one thing:

```typescript
// ✅ Good - Single responsibility
class CacheManager {
  // Only cache operations
}

class SessionValidationService {
  // Only session validation
}

// ❌ Bad - Multiple responsibilities
class CacheAndValidationService {
  // Both cache and validation - too much!
}
```

### Configuration Over Code

Use configuration, not hardcoded values:

```typescript
// ✅ Good - Use configuration
const ttl = MiddlewareConfig.sessionVerifyTtl;

// ❌ Bad - Hardcoded value
const ttl = 15000;
```

## 🔍 Troubleshooting

### Issue: Cache not working

```typescript
// Check cache size
const cache = new CacheManager();
console.log('Cache entries:', Array.from(cache.keys()).length);
```

### Issue: Redirects not working

```typescript
// Enable debug mode
NEXT_PUBLIC_DEBUG_AUTH=1

// Check logs for redirect decisions
```

### Issue: Backend validation failing

```typescript
// Check backend URL
import { backendPath } from "@/lib/backend";
console.log('Backend URL:', backendPath("/auth/session/validate"));
```

### Issue: TypeScript errors

```bash
# Rebuild TypeScript cache
cd frontendNEx
rm -rf .next
npm run build
```

## 📖 Further Reading

- **Architecture**: See `ARCHITECTURE.md` for detailed diagrams
- **Migration**: See `../MIDDLEWARE_MIGRATION.md` for migration guide
- **Full Documentation**: See `README.md` for complete documentation

## 🎯 Best Practices

1. **Always use TypeScript types** - Don't use `any`
2. **Add JSDoc comments** - Document public methods
3. **Use debug logging** - Help future debugging
4. **Test your changes** - Unit test new components
5. **Follow naming conventions** - Services end with `Service`
6. **Keep methods small** - One method, one purpose
7. **Use configuration** - Avoid hardcoded values
8. **Inject dependencies** - Don't create inside classes

## 💡 Tips

- **Use VS Code**: Jump to definition with Ctrl+Click
- **Use search**: Find usage with Ctrl+Shift+F
- **Use git blame**: See why code was written
- **Read tests**: Tests show how to use components
- **Check logs**: Debug mode shows what's happening

## 🚨 Common Mistakes

### Mistake 1: Modifying wrong file

```bash
# ❌ Don't modify middleware.backup.ts
# ✅ Modify files in middleware/ folder
```

### Mistake 2: Forgetting to export

```typescript
// ❌ Forgot to export
class MyService {}

// ✅ Remember to export
export class MyService {}
```

### Mistake 3: Circular dependencies

```typescript
// ❌ A imports B, B imports A
// ✅ Use dependency injection to break cycles
```

### Mistake 4: Not using configuration

```typescript
// ❌ Hardcoded value
const timeout = 15000;

// ✅ Use configuration
const timeout = MiddlewareConfig.sessionVerifyTtl;
```

## 🎓 Learning Path

1. **Day 1**: Read this guide + ARCHITECTURE.md
2. **Day 2**: Explore code, enable debug mode
3. **Day 3**: Make small change (add config option)
4. **Day 4**: Create new utility function
5. **Day 5**: Create new service

## 🤝 Getting Help

1. **Check documentation** in `README.md`
2. **Enable debug mode** to see what's happening
3. **Read the code** - it's well-documented
4. **Check git history** - see why changes were made
5. **Ask the team** - we're here to help!

## ✅ Checklist for New Features

- [ ] Add configuration to `config.ts` if needed
- [ ] Add types to `types.ts` if needed
- [ ] Create service/handler/utility as appropriate
- [ ] Export from `index.ts` if public API
- [ ] Add JSDoc comments
- [ ] Test your changes
- [ ] Update documentation
- [ ] Enable debug logging for troubleshooting
- [ ] Check for TypeScript errors
- [ ] Test all authentication flows

---

**Happy coding!** 🎉

Remember: The refactored middleware is designed to be easy to understand and modify. If something is unclear, it's a documentation bug - let us know!
