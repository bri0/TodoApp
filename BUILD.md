# Production Build Guide

This document describes how to build the TodoApp for production using the comprehensive build script powered by Bun.js.

## Prerequisites

- **Bun.js** (v1.0.0 or later) - [Install from bun.sh](https://bun.sh)
- **Node.js** (v18 or later) - Required for TypeScript compiler
- **Git** - For version information in build manifest

## Quick Start

### Standard Production Build

```bash
# Using npm script (recommended)
bun run build:prod

# Or run the script directly
./build-production.sh
```

### Build with Analysis

Generate a detailed bundle analysis report:

```bash
bun run build:prod:analyze
```

### Fast Build (Skip Validation)

Skip linting and type checking for faster builds:

```bash
bun run build:prod:fast
```

## Script Options

The build script supports several command-line options:

```bash
./build-production.sh [OPTIONS]
```

### Available Options

| Option             | Description                                |
| ------------------ | ------------------------------------------ |
| `--skip-lint`      | Skip ESLint validation                     |
| `--skip-typecheck` | Skip TypeScript type checking              |
| `--analyze`        | Generate detailed bundle analysis report   |
| `--verbose`        | Show detailed build logs                   |
| `--clean-install`  | Clean install dependencies before building |
| `--help`           | Show help message                          |

### Examples

```bash
# Build with verbose output
./build-production.sh --verbose

# Build with analysis and verbose output
./build-production.sh --analyze --verbose

# Clean build from scratch
./build-production.sh --clean-install

# Fast build skipping checks
./build-production.sh --skip-lint --skip-typecheck
```

## Build Process

The build script performs the following steps:

### 1. Pre-Build Phase

- Validates Bun.js and Node.js installation
- Verifies dependencies
- Cleans previous build artifacts (`dist/`, `.cache/`, `dev-dist/`)
- Displays environment information

### 2. Build Phase

- **TypeScript Type Checking**: Ensures no type errors
- **ESLint Validation**: Checks code quality and standards
- **Vite Build**: Compiles and optimizes the application
  - Tree shaking
  - Code minification (Terser)
  - CSS minification
  - Chunk splitting
  - Asset optimization
  - PWA service worker generation

### 3. Post-Build Phase

- Validates build output
- Analyzes bundle sizes
- Generates build manifest
- Creates optimization report

## Build Artifacts

After a successful build, you'll find:

### dist/ Directory

The production-ready application files:

- `index.html` - Main HTML file
- `manifest.webmanifest` - PWA manifest
- `sw.js` - Service worker
- `assets/` - Compiled JavaScript, CSS, and optimized assets

### Build Manifest

`dist/build-manifest.json` contains metadata about the build:

```json
{
  "buildTime": "2024-11-21T12:00:00Z",
  "buildDuration": "45s",
  "bunVersion": "1.0.0",
  "nodeVersion": "v18.0.0",
  "environment": "production",
  "totalSize": "2.5M",
  "files": {
    "javascript": 15,
    "css": 3,
    "images": 25,
    "fonts": 2
  },
  "git": {
    "branch": "main",
    "commit": "abc1234",
    "tag": "v1.0.0"
  }
}
```

### Build Logs

Each build creates a timestamped log file:

- `build-YYYYMMDD-HHMMSS.log`

### Analysis Reports (Optional)

When using `--analyze` flag:

- `build-analysis-YYYYMMDD-HHMMSS.txt`

## Optimization Strategy

The build includes several optimizations:

### Code Splitting

Chunks are strategically split for optimal loading:

- **vendor-react**: React core libraries (react, react-dom, scheduler)
- **ui-lib**: UI components (MUI, Emotion)
- **dnd-kit**: Drag-and-drop functionality
- **emoji**: Emoji picker components
- **ntc**: Color naming library
- **vendor**: Other third-party libraries
- **tasks**: Task management components
- **settings**: Settings components

### PWA Optimizations

- Service worker with Workbox caching strategies
- Offline functionality
- Precached critical assets
- Runtime caching for external resources
- Background sync support

### Performance Features

- Tree shaking to remove unused code
- Minification of JavaScript and CSS
- Asset optimization (images, fonts)
- Source maps for debugging
- Lazy loading of route components
- Efficient chunk loading strategy

## Environment Variables

Create a `.env.production` file for production-specific configuration. Use the provided template:

```bash
# Copy the template
cp env.production.template .env.production

# Edit with your values
nano .env.production
```

Environment variables prefixed with `VITE_` are embedded into the build and accessible in your application.

**Important**: Never commit sensitive keys to version control.

## Testing the Build

After building, test the production build locally:

```bash
# Preview the production build
bun run preview

# Preview on network (for mobile testing)
bun run preview:host
```

This starts a local server serving the `dist/` directory.

## Deployment

### Netlify (Automatic)

The project is configured for automatic Netlify deployment. Simply push to your repository:

```bash
git push origin main
```

Netlify will automatically:

1. Install dependencies
2. Run the build
3. Deploy the `dist/` directory

### Manual Deployment

1. Build the project:

   ```bash
   bun run build:prod
   ```

2. Upload the `dist/` directory to your hosting provider

3. Configure your server:
   - Serve `index.html` for all routes (SPA routing)
   - Enable HTTPS (required for PWA features)
   - Set proper cache headers
   - Enable gzip/brotli compression

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY dist/ .
RUN npm install -g serve
CMD ["serve", "-s", ".", "-p", "3000"]
```

## CI/CD Integration

The build script is designed for CI/CD pipelines with:

- Proper exit codes for success/failure
- Non-interactive execution
- Detailed logging
- Build manifest for tracking

### GitHub Actions Example

```yaml
name: Production Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build
        run: bun run build:prod

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

## Troubleshooting

### Build Fails on Type Checking

```bash
# Check TypeScript errors
bun run test:typecheck

# Skip type checking temporarily
./build-production.sh --skip-typecheck
```

### Build Fails on Linting

```bash
# Check linting errors
bun run lint

# Auto-fix issues
bun run lint:fix

# Skip linting temporarily
./build-production.sh --skip-lint
```

### Out of Memory

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
./build-production.sh
```

### Slow Build Times

```bash
# Use fast build (skip validation)
bun run build:prod:fast

# Clean install if cache is corrupted
./build-production.sh --clean-install
```

## Performance Benchmarks

Typical build times on modern hardware:

- **Type Checking**: 5-10 seconds
- **Linting**: 3-5 seconds
- **Vite Build**: 30-60 seconds
- **Total**: ~45-75 seconds

Fast build (skip validation): ~30-40 seconds

## Best Practices

1. **Always run full build before deploying** - Use `bun run build:prod`
2. **Test locally** - Use `bun run preview` before deployment
3. **Review bundle sizes** - Use `--analyze` flag periodically
4. **Keep dependencies updated** - Run `bun update` regularly
5. **Monitor build times** - Investigate if builds become slow
6. **Check PWA functionality** - Verify service worker and offline mode
7. **Use environment variables** - Keep configuration separate
8. **Version your builds** - Use git tags for releases

## Support

For issues or questions:

- Check [Vite Documentation](https://vitejs.dev)
- Check [Bun Documentation](https://bun.sh/docs)
- Review build logs
- Run with `--verbose` flag for detailed output

## License

MIT
