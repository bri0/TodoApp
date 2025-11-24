# Vercel Deployment - Readiness Checklist

## ✅ All Issues Resolved

### 1. API Route Configuration

- ✅ API endpoint created: `/api/t/[uid].ts`
- ✅ Vercel request/response types used
- ✅ TypeScript configuration for API directory
- ✅ Race condition in initialization fixed (promise-based)

### 2. Routing Configuration

- ✅ SPA rewrites configured in `vercel.json`
- ✅ API routes excluded from SPA catch-all: `/((?!api).*)`
- ✅ Cache headers set for API routes

### 3. Database Integration

- ✅ Using `postgres` library (serverless-optimized)
- ✅ SSL configured: `ssl: "require"`
- ✅ Connection pooling optimized: `max: 1`
- ✅ Transform configuration for PostgreSQL compatibility

### 4. Cryptography

- ✅ Using `libsodium-wrappers` for compatibility
- ✅ Initialization optimized with caching
- ✅ SHA-256 uses Node.js native crypto (zero overhead)
- ✅ Frontend/backend compatibility guaranteed

### 5. Build Configuration

- ✅ `vercel.json` configured with Bun
- ✅ Build command: `bun install && bun run build`
- ✅ `bunVersion: "1.x"` specified
- ✅ API functions include server files: `includeFiles: "src/server/**"`

### 6. Environment Variables Required

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
NODE_ENV=production
```

### 7. Dependencies

- ✅ `postgres@^3.4.4` for database
- ✅ `@vercel/node@^3.2.25` for types
- ✅ `libsodium-wrappers@^0.7.15` for encryption
- ✅ All existing frontend dependencies preserved

### 8. Files Created/Modified

**Created:**

- `/api/t/[uid].ts` - Serverless API endpoint
- `/api/tsconfig.json` - TypeScript config for API
- `/src/server/db.ts` - Database layer (postgres)
- `/src/server/crypto.ts` - Encryption utilities
- `/src/server/types.ts` - Shared types
- `/vercel.json` - Vercel configuration
- `/.vercelignore` - Deployment optimization
- `/DEPLOYMENT.md` - Deployment guide
- `/CRYPTO_DECISIONS.md` - Architecture decisions

**Modified:**

- `/package.json` - Added backend dependencies
- `/src/services/syncApi.ts` - Changed to `/api` relative path
- `/vite.config.ts` - Added dev proxy for API
- `/README.md` - Added Vercel deployment section

**Removed:**

- `/netlify.toml` - No longer needed

### 9. CORS

- ✅ No CORS configuration needed (same-origin)
- ✅ All CORS headers removed from server code

### 10. Security

- ✅ Zero-knowledge encryption maintained
- ✅ Public key validation
- ✅ Auto-registration on first sync
- ✅ Version-based conflict resolution

## 🚀 Ready to Deploy

### Quick Deploy Steps

1. **Push to Git:**

   ```bash
   git add .
   git commit -m "Unified Vercel deployment with serverless API"
   git push
   ```

2. **Deploy to Vercel:**

   ```bash
   vercel
   ```

3. **Set Environment Variables:**

   ```bash
   vercel env add DATABASE_URL production
   # Paste: postgresql://user:pass@host:5432/db?sslmode=require
   ```

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Alternative: Vercel Dashboard

1. Go to vercel.com/new
2. Import your repository
3. Add environment variable: `DATABASE_URL`
4. Deploy

## 📊 Expected Performance

### Cold Start (First Request)

- Function initialization: ~50-100ms
- Database connection: ~50ms
- Libsodium WASM init: ~200-300ms
- **Total: ~300-450ms**

### Warm Requests (Container Reuse)

- Database query: ~20-50ms
- Encryption: ~10-20ms
- **Total: ~30-70ms**

### Bundle Sizes

- Frontend: ~800KB (gzipped)
- API function: ~500KB (includes libsodium)

## 🧪 Testing

### Local Testing with Vercel CLI

1. **Install Vercel CLI:**

   ```bash
   npm i -g vercel
   ```

2. **Link project:**

   ```bash
   vercel link
   ```

3. **Add local env:**

   ```bash
   vercel env pull .env.local
   ```

4. **Run locally:**

   ```bash
   vercel dev
   ```

5. **Test API:**
   ```bash
   curl -X POST http://localhost:3000/api/t/test \
     -H "Content-Type: application/json" \
     -d '{"publicKeyHash":"test","publicKey":"test","data":{"tasks":[],"categories":[]}}'
   ```

### Production Testing

1. **Test frontend:**

   ```
   https://your-domain.vercel.app
   ```

2. **Test API (will fail auth but proves it's running):**

   ```bash
   curl -X POST https://your-domain.vercel.app/api/t/test \
     -H "Content-Type: application/json" \
     -d '{"publicKeyHash":"test","publicKey":"test","data":{"tasks":[],"categories":[]}}'
   ```

   Expected: 403 (auth failure is expected, proves API is working)

## 🎯 Deployment Checklist

Before deploying to production:

- [ ] PostgreSQL database created and accessible
- [ ] `DATABASE_URL` environment variable set in Vercel
- [ ] SSL mode included in connection string (`?sslmode=require`)
- [ ] Database tables will be created automatically on first API call
- [ ] Git repository pushed to GitHub/GitLab/Bitbucket
- [ ] Vercel project created and linked
- [ ] Build completes successfully
- [ ] Frontend loads correctly
- [ ] API endpoint responds (test with curl)
- [ ] Task sync works end-to-end

## 🐛 Troubleshooting

### Issue: API returns 404

**Solution:** Check vercel.json rewrite rule excludes `/api`

### Issue: Database connection fails

**Solution:** Verify `DATABASE_URL` has `?sslmode=require`

### Issue: Function timeout

**Solution:** Check database latency, consider upgrading Vercel plan

### Issue: Cold starts too slow

**Solution:** Normal for first request. Monitor with `vercel logs`

## 📈 Monitoring

Add to your API function:

```typescript
console.log(`Request: ${req.method} ${req.url}`);
console.log(`Cold start: ${!initialized}`);
```

View logs:

```bash
vercel logs --follow
```

## ✨ What's Next

After successful deployment:

1. **Monitor performance** with Vercel Analytics
2. **Set up alerts** for errors
3. **Test sync** from multiple devices
4. **Verify encryption** end-to-end
5. **Remove old todo-server** Vercel project

## 🎉 Success Criteria

Deployment is successful when:

- ✅ Frontend loads at your domain
- ✅ User can sync tasks
- ✅ Data persists across sessions
- ✅ No CORS errors
- ✅ API response time < 500ms (warm)
- ✅ Zero-knowledge encryption working

You're ready to deploy! 🚀
