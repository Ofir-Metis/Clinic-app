#!/bin/bash
# Enterprise Production Environment Fix Script
# Adds env_file configuration to all microservices in docker-compose.production-ready.yml

set -euo pipefail

echo "🏢 Enterprise Production Environment Configuration Fix"
echo "=================================================="

# Services that need env_file configuration
SERVICES=(
    "appointments-service"
    "files-service" 
    "notifications-service"
    "ai-service"
    "notes-service"
    "analytics-service"
    "settings-service"
    "billing-service"
    "search-service"
    "cdn-service"
    "google-integration-service"
    "therapists-service"
    "client-relationships-service"
    "progress-service"
)

echo "📝 Adding env_file configuration to ${#SERVICES[@]} services..."

for service in "${SERVICES[@]}"; do
    echo "   - Configuring $service..."
    
    # Use sed to add env_file after the dockerfile line
    sed -i "/^  ${service}:/,/^  [a-z]/ {
        /dockerfile: / a\\
    env_file:\\
      - .env.production
    }" docker-compose.production-ready.yml
done

echo ""
echo "✅ Environment configuration added to all services"
echo "🔧 Next steps:"
echo "   1. Rebuild services: docker-compose -f docker-compose.production-ready.yml build"
echo "   2. Restart services: docker-compose -f docker-compose.production-ready.yml up -d"
echo "   3. Check logs: docker-compose -f docker-compose.production-ready.yml logs"