# Vercel Deployment Guide

This guide covers deploying the unified TodoApp (frontend + backend) to Vercel.

## Architecture

The app now consists of:

- **Frontend**: React app built with Vite, served from root domain
- **Backend**: Serverless API functions at `/api/t/:uid`
- **Database**: PostgreSQL with zero-knowledge encryption

## Prerequisites

### 1. PostgreSQL Database

You need a PostgreSQL database with SSL support. Recommended providers:

- **Vercel Postgres**: Integrated with Vercel (easiest)

  ```bash
  vercel postgres create
  ```

- **Neon**: Serverless PostgreSQL

  - Sign up at [neon.tech](https://neon.tech)
  - Create a new project
  - Copy the connection string

- **Supabase**: PostgreSQL with additional features
  - Sign up at [supabase.com](https://supabase.com)
  - Create a new project
  - Get connection string from Settings > Database

### 2. Vercel Account

Sign up at [vercel.com](https://vercel.com) if you don't have an account.

## Deployment Steps

### Option A: Deploy via Vercel CLI

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy**:

   ```bash
   vercel
   ```

4. **Set environment variables**:

   ```bash
   vercel env add DATABASE_URL production
   # Paste your PostgreSQL connection string
   ```

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via Vercel Dashboard

1. **Import your repository**:

   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Select the TodoApp project

2. **Configure Build Settings**:

   - Framework Preset: `Other`
   - Build Command: `bun install && bun run build`
   - Output Directory: `dist`
   - Install Command: `bun install`

3. **Add Environment Variables**:

   - Go to Project Settings > Environment Variables
   - Add the following:

   | Variable       | Value                                                     | Environment                      |
   | -------------- | --------------------------------------------------------- | -------------------------------- |
   | `DATABASE_URL` | `postgresql://user:password@host:5432/db?sslmode=require` | Production, Preview, Development |
   | `NODE_ENV`     | `production`                                              | Production                       |

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

## Environment Variables

### Required Variables

#### `DATABASE_URL`

Your PostgreSQL connection string with SSL enabled.

**Format**:

```
postgresql://username:password@host:port/database?sslmode=require
```

**Examples**:

- Vercel Postgres: `postgres://default:xxx@xxx-pooler.xxx.vercel-storage.com:5432/verceldb?sslmode=require`
- Neon: `postgresql://user:pwd@xxx.neon.tech/neondb?sslmode=require`
- Supabase: `postgresql://postgres:pwd@xxx.supabase.co:5432/postgres?sslmode=require`

**Important**: Make sure to include `?sslmode=require` at the end!

### Optional Variables

#### `NODE_ENV`

Set to `production` for production deployments. Vercel sets this automatically.

## Database Schema

The database schema is automatically created on first deployment. The following tables will be created:

### `users` table

- `uid` (TEXT, PRIMARY KEY): User identifier
- `public_key_hash` (TEXT, UNIQUE): SHA-256 hash of public key for authentication
- `public_key` (TEXT): Public key for encrypting user data
- `created_at` (BIGINT): Timestamp of user creation

### `user_data` table

- `uid` (TEXT, PRIMARY KEY): User identifier (foreign key to users)
- `encrypted_data` (TEXT): Encrypted task/category data
- `version` (BIGINT): Version number for conflict resolution
- `updated_at` (BIGINT): Timestamp of last update

## API Endpoints

### POST `/api/t/:uid`

Sync user data with zero-knowledge encryption.

**Request Body**:

```json
{
  "publicKeyHash": "sha256_hash_of_public_key",
  "publicKey": "hex_encoded_public_key",
  "data": {
    "tasks": [...],
    "categories": [...]
  },
  "merged": false
}
```

**Response**:

```json
{
  "encryptedData": "base64_encrypted_data",
  "version": 123,
  "needsMerge": false
}
```

## Verifying Deployment

1. **Check frontend**:

   ```bash
   curl https://your-domain.vercel.app
   ```

2. **Check API health**:

   ```bash
   # Test with a dummy request (will fail auth, but proves API is running)
   curl -X POST https://your-domain.vercel.app/api/t/test \
     -H "Content-Type: application/json" \
     -d '{"publicKeyHash":"test","publicKey":"test","data":{"tasks":[],"categories":[]}}'
   ```

3. **Check Vercel logs**:
   ```bash
   vercel logs
   ```

## Troubleshooting

### Database Connection Errors

**Issue**: `Failed to connect to database`

**Solutions**:

- Verify `DATABASE_URL` is correct
- Ensure SSL mode is set: `?sslmode=require`
- Check database is accessible from external IPs
- Verify database credentials are correct

### API Routes Not Working

**Issue**: API returns 404

**Solutions**:

- Verify `vercel.json` is in the project root
- Check the `api/` directory exists with the function files
- Ensure the rewrite rule excludes API routes: `"source": "/((?!api).*)""`

### Build Failures

**Issue**: Build fails during deployment

**Solutions**:

- Check that `bun` is being used correctly
- Verify all dependencies are in `package.json`
- Check TypeScript compilation errors in logs
- Try building locally first: `bun run build`

### Function Timeout

**Issue**: API requests timeout after 10s

**Solutions**:

- Upgrade to Vercel Pro for 60s timeout
- Optimize database queries
- Check for slow encryption operations
- Review function logs for bottlenecks

## Local Development

To test the full stack locally:

1. **Set up local environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Start dev server**:

   ```bash
   bun run dev
   ```

4. **Test API locally**:
   The Vite dev server will proxy API requests to your backend.

## Security Notes

- **Zero-Knowledge Encryption**: The server never has access to decrypted user data
- **SSL Required**: All database connections use SSL
- **No CORS Issues**: Same-origin deployment eliminates CORS vulnerabilities
- **Auto-Registration**: Users are created on first sync, no separate registration endpoint
- **Public Key Validation**: SHA-256 hash prevents spoofing

## Performance

- **Cold Start**: ~500ms with Node.js runtime
- **Database Queries**: Optimized with single connection per request
- **Encryption**: Libsodium provides fast cryptographic operations
- **Caching**: API responses have no-cache headers to ensure data freshness

## Cost Estimation

### Vercel

- Free tier: 100GB bandwidth, 100GB-hrs compute
- Pro tier: $20/mo for longer function timeouts

### Database

- Vercel Postgres: $20/mo for 2GB storage
- Neon: Free tier available, $19/mo for production
- Supabase: Free tier available, $25/mo for production

## Migration from Separate Servers

If you're migrating from the old two-server setup:

1. **Update frontend code**: Already done, uses `/api` prefix
2. **Migrate database**: Use the same PostgreSQL database
3. **Update environment variables**: Set `DATABASE_URL` in Vercel
4. **Remove old Vercel project**: Delete the separate todo-server project
5. **Test thoroughly**: Verify sync works end-to-end

## Support

For issues or questions:

- Check Vercel deployment logs
- Review database connection in provider dashboard
- Test API endpoints with curl/Postman
- Check browser console for frontend errors
