#!/bin/bash

################################################################################
# Production Build Script for TodoApp with Bun.js
#
# This script handles the complete production build pipeline with:
# - Pre-build validation and cleanup
# - TypeScript type checking
# - ESLint validation
# - Optimized Vite build with PWA support
# - Post-build validation and reporting
# - Bundle size analysis
#
# Usage: ./build-production.sh [OPTIONS]
#
# Options:
#   --skip-lint         Skip ESLint validation
#   --skip-typecheck    Skip TypeScript type checking
#   --analyze           Generate detailed bundle analysis
#   --verbose           Show detailed build logs
#   --clean-install     Clean install dependencies before build
#   --help              Show this help message
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
BUILD_DIR="dist"
CACHE_DIR=".cache"
LOG_FILE="build-$(date +%Y%m%d-%H%M%S).log"
START_TIME=$(date +%s)

# Flags
SKIP_LINT=false
SKIP_TYPECHECK=false
ANALYZE=false
VERBOSE=false
CLEAN_INSTALL=false

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${MAGENTA}[INFO]${NC} $1"
}

elapsed_time() {
    local end_time=$(date +%s)
    local elapsed=$((end_time - START_TIME))
    local minutes=$((elapsed / 60))
    local seconds=$((elapsed % 60))
    echo "${minutes}m ${seconds}s"
}

show_help() {
    echo "Production Build Script for TodoApp"
    echo ""
    echo "Usage: ./build-production.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --skip-lint         Skip ESLint validation"
    echo "  --skip-typecheck    Skip TypeScript type checking"
    echo "  --analyze           Generate detailed bundle analysis"
    echo "  --verbose           Show detailed build logs"
    echo "  --clean-install     Clean install dependencies before build"
    echo "  --help              Show this help message"
    echo ""
    exit 0
}

################################################################################
# Parse Command Line Arguments
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        --skip-typecheck)
            SKIP_TYPECHECK=true
            shift
            ;;
        --analyze)
            ANALYZE=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --clean-install)
            CLEAN_INSTALL=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            ;;
    esac
done

################################################################################
# Pre-Build Phase
################################################################################

print_header "TodoApp Production Build"

print_info "Build started at $(date '+%Y-%m-%d %H:%M:%S')"
print_info "Log file: $LOG_FILE"

# Check if Bun is installed
print_step "Checking Bun.js installation..."
if ! command -v bun &> /dev/null; then
    print_error "Bun.js is not installed. Please install it from https://bun.sh"
    exit 1
fi

BUN_VERSION=$(bun --version)
print_success "Bun.js version: $BUN_VERSION"

# Check Node.js (for TypeScript compiler)
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Required for TypeScript compiler."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Display environment info
print_info "Operating System: $(uname -s)"
print_info "Architecture: $(uname -m)"
print_info "Working Directory: $(pwd)"

# Clean install if requested
if [ "$CLEAN_INSTALL" = true ]; then
    print_step "Performing clean dependency installation..."
    rm -rf node_modules bun.lockb
    bun install
    print_success "Dependencies installed"
fi

# Verify dependencies
print_step "Verifying dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    bun install
fi
print_success "Dependencies verified"

# Clean previous build artifacts
print_step "Cleaning previous build artifacts..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    print_success "Removed $BUILD_DIR directory"
fi

if [ -d "$CACHE_DIR" ]; then
    rm -rf "$CACHE_DIR"
    print_success "Removed $CACHE_DIR directory"
fi

# Remove dev-dist if exists
if [ -d "dev-dist" ]; then
    rm -rf "dev-dist"
    print_success "Removed dev-dist directory"
fi

################################################################################
# Build Phase
################################################################################

print_header "Build Phase"

# Set production environment
export NODE_ENV=production
export VITE_BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
print_info "NODE_ENV set to: production"

# Load .env.production if exists
if [ -f ".env.production" ]; then
    print_info "Loading .env.production"
    set -a
    source .env.production
    set +a
fi

# TypeScript Type Checking
if [ "$SKIP_TYPECHECK" = false ]; then
    print_step "Running TypeScript type checking..."
    TYPECHECK_START=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        bun run test:typecheck
    else
        bun run test:typecheck > /dev/null 2>&1
    fi

    TYPECHECK_END=$(date +%s)
    TYPECHECK_TIME=$((TYPECHECK_END - TYPECHECK_START))
    print_success "TypeScript type checking passed (${TYPECHECK_TIME}s)"
else
    print_warning "Skipping TypeScript type checking"
fi

# ESLint Validation
if [ "$SKIP_LINT" = false ]; then
    print_step "Running ESLint validation..."
    LINT_START=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        bun run lint
    else
        bun run lint > /dev/null 2>&1
    fi

    LINT_END=$(date +%s)
    LINT_TIME=$((LINT_END - LINT_START))
    print_success "ESLint validation passed (${LINT_TIME}s)"
else
    print_warning "Skipping ESLint validation"
fi

# Main Build
print_step "Building production bundle with Vite..."
BUILD_START=$(date +%s)

if [ "$VERBOSE" = true ]; then
    bun run build 2>&1 | tee -a "$LOG_FILE"
else
    bun run build > "$LOG_FILE" 2>&1
fi

BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))
print_success "Production build completed (${BUILD_TIME}s)"

################################################################################
# Post-Build Phase
################################################################################

print_header "Post-Build Validation"

# Verify build output
print_step "Verifying build output..."

REQUIRED_FILES=(
    "$BUILD_DIR/index.html"
    "$BUILD_DIR/manifest.webmanifest"
    "$BUILD_DIR/sw.js"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    print_success "All required files present"
else
    print_error "Missing required files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    exit 1
fi

# Check for JavaScript bundles
JS_FILES=$(find "$BUILD_DIR" -name "*.js" -type f | wc -l)
CSS_FILES=$(find "$BUILD_DIR" -name "*.css" -type f | wc -l)

print_info "JavaScript files: $JS_FILES"
print_info "CSS files: $CSS_FILES"

################################################################################
# Bundle Size Analysis
################################################################################

print_header "Bundle Size Analysis"

print_step "Analyzing bundle sizes..."

# Calculate total size
TOTAL_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
print_info "Total build size: $TOTAL_SIZE"

# Analyze JS files
echo -e "\n${BOLD}JavaScript Bundles:${NC}"
find "$BUILD_DIR" -name "*.js" ! -name "*.map" -type f -exec du -h {} \; | sort -rh | head -20 | while read size file; do
    filename=$(basename "$file")
    echo "  $size  $filename"
done

# Analyze CSS files
echo -e "\n${BOLD}CSS Files:${NC}"
find "$BUILD_DIR" -name "*.css" ! -name "*.map" -type f -exec du -h {} \; | sort -rh | while read size file; do
    filename=$(basename "$file")
    echo "  $size  $filename"
done

# Count assets
IMAGES=$(find "$BUILD_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.webp" \) | wc -l)
FONTS=$(find "$BUILD_DIR" -type f \( -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" \) | wc -l)

print_info "Image files: $IMAGES"
print_info "Font files: $FONTS"

################################################################################
# Detailed Analysis (if requested)
################################################################################

if [ "$ANALYZE" = true ]; then
    print_header "Detailed Bundle Analysis"

    print_step "Generating detailed analysis..."

    # Create analysis report
    ANALYSIS_FILE="build-analysis-$(date +%Y%m%d-%H%M%S).txt"

    {
        echo "TodoApp Production Build Analysis"
        echo "Generated: $(date)"
        echo "=================================="
        echo ""
        echo "Build Configuration:"
        echo "  - Bun.js Version: $BUN_VERSION"
        echo "  - Node.js Version: $NODE_VERSION"
        echo "  - Build Time: ${BUILD_TIME}s"
        echo "  - Total Size: $TOTAL_SIZE"
        echo ""
        echo "File Breakdown:"
        echo ""
        echo "JavaScript Files:"
        find "$BUILD_DIR" -name "*.js" ! -name "*.map" -type f -exec du -h {} \; | sort -rh
        echo ""
        echo "CSS Files:"
        find "$BUILD_DIR" -name "*.css" ! -name "*.map" -type f -exec du -h {} \; | sort -rh
        echo ""
        echo "Assets:"
        echo "  Images: $IMAGES"
        echo "  Fonts: $FONTS"
        echo ""
        echo "Directory Structure:"
        tree -L 3 "$BUILD_DIR" 2>/dev/null || find "$BUILD_DIR" -type d | head -50
    } > "$ANALYSIS_FILE"

    print_success "Analysis report saved to: $ANALYSIS_FILE"
fi

################################################################################
# Generate Build Manifest
################################################################################

print_header "Build Manifest"

MANIFEST_FILE="$BUILD_DIR/build-manifest.json"

print_step "Generating build manifest..."

cat > "$MANIFEST_FILE" << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildDuration": "${BUILD_TIME}s",
  "bunVersion": "$BUN_VERSION",
  "nodeVersion": "$NODE_VERSION",
  "environment": "production",
  "totalSize": "$TOTAL_SIZE",
  "files": {
    "javascript": $JS_FILES,
    "css": $CSS_FILES,
    "images": $IMAGES,
    "fonts": $FONTS
  },
  "git": {
    "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "tag": "$(git describe --tags --abbrev=0 2>/dev/null || echo 'none')"
  }
}
EOF

print_success "Build manifest created: $MANIFEST_FILE"

################################################################################
# Optimization Report
################################################################################

print_header "Optimization Report"

echo -e "${BOLD}Applied Optimizations:${NC}"
echo "  - Tree shaking enabled"
echo "  - Code minification (Terser)"
echo "  - CSS minification"
echo "  - Chunk splitting (vendor-react, ui-lib, dnd-kit, emoji)"
echo "  - Asset optimization"
echo "  - PWA service worker generation"
echo "  - Workbox caching strategies"
echo "  - Source maps generated"

echo -e "\n${BOLD}Chunk Strategy:${NC}"
echo "  - vendor-react: React core libraries"
echo "  - ui-lib: MUI and Emotion components"
echo "  - dnd-kit: Drag-and-drop functionality"
echo "  - emoji: Emoji picker components"
echo "  - ntc: Color name library"
echo "  - vendor: Other third-party libraries"
echo "  - tasks: Task management components"
echo "  - settings: Settings components"

################################################################################
# Final Summary
################################################################################

print_header "Build Summary"

END_TIME=$(date +%s)
TOTAL_TIME=$((END_TIME - START_TIME))
TOTAL_MINUTES=$((TOTAL_TIME / 60))
TOTAL_SECONDS=$((TOTAL_TIME % 60))

echo -e "${BOLD}${GREEN}Build completed successfully!${NC}\n"
echo "Build Directory: $BUILD_DIR"
echo "Total Build Time: ${TOTAL_MINUTES}m ${TOTAL_SECONDS}s"
echo "Build Log: $LOG_FILE"
echo "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"

echo -e "\n${BOLD}Next Steps:${NC}"
echo "  1. Test the build locally:"
echo "     ${CYAN}bun run preview${NC}"
echo ""
echo "  2. Deploy to production:"
echo "     - Netlify: Push to git repository (auto-deploy)"
echo "     - Manual: Upload ${CYAN}$BUILD_DIR${NC} directory to your hosting"
echo ""
echo "  3. Verify PWA functionality:"
echo "     - Service Worker registration"
echo "     - Offline capability"
echo "     - Install prompt"

print_success "Production build pipeline completed!"

exit 0
