#!/bin/bash
# Enterprise Production Dependency Management Script
# Resolves lockfile corruption with zero-downtime approach

set -euo pipefail

echo "🏢 Enterprise Dependency Resolution Started"

# Step 1: Backup current state
echo "📦 Backing up current dependency state..."
cp yarn.lock yarn.lock.backup 2>/dev/null || true
cp package.json package.json.backup

# Step 2: Enterprise Docker-based resolution
echo "🐳 Running Docker-based dependency resolution..."
docker compose --profile deps-management build deps-resolver

# Step 3: Extract clean lockfile from container
echo "🔄 Extracting enterprise-validated lockfile..."
docker compose --profile deps-management run --rm deps-resolver /bin/sh -c "
    yarn cache clean && \
    yarn install --force --frozen-lockfile=false && \
    yarn check --integrity
" || {
    echo "❌ Docker resolution failed, attempting local fallback..."
    
    # Fallback: Local resolution with enterprise config
    if command -v yarn >/dev/null 2>&1; then
        yarn config set registry https://registry.npmjs.org/
        yarn config set network-timeout 300000
        rm -rf node_modules yarn.lock 2>/dev/null || true
        yarn install --force
    else
        echo "⚠️  Yarn not available locally. Using npm fallback..."
        rm -rf node_modules package-lock.json 2>/dev/null || true
        npm install --package-lock-only
        npx yarn import
    fi
}

# Step 4: Validate integrity
echo "✅ Validating lockfile integrity..."
if docker compose --profile deps-management run --rm deps-resolver yarn check --integrity; then
    echo "🎉 Enterprise dependency resolution completed successfully!"
    rm -f yarn.lock.backup package.json.backup
else
    echo "❌ Integrity check failed. Restoring backup..."
    mv yarn.lock.backup yarn.lock 2>/dev/null || true
    mv package.json.backup package.json 2>/dev/null || true
    exit 1
fi

echo "✨ Production-ready dependency state achieved"