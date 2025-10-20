@echo off
echo.
echo 🏗️ CLINIC APP - SIMPLE PRODUCTION REBUILD
echo ============================================
echo.

cd /d "%~dp0.."

echo Step 1: Cleanup existing environment...
docker compose down --timeout 30
docker image prune -f

echo.
echo Step 2: Install dependencies...
yarn install --frozen-lockfile
yarn workspace @clinic/common build

echo.
echo Step 3: Build and start services...
docker compose build --no-cache
docker compose up -d postgres redis nats minio maildev
timeout /t 20

echo.
echo Step 4: Start application services...
docker compose up -d auth-service files-service settings-service
timeout /t 10
docker compose up -d appointments-service notes-service notifications-service analytics-service
timeout /t 10
docker compose up -d billing-service therapists-service google-integration-service client-relationships-service
timeout /t 10
docker compose up -d api-gateway
timeout /t 10
docker compose up -d frontend nginx

echo.
echo Step 5: Show status...
docker compose ps

echo.
echo 🎉 Deployment completed!
echo Frontend: http://localhost:5173
echo API: http://localhost:4000
echo.

pause