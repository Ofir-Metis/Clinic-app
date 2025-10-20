@echo off
echo ===============================================
echo 🚀 CLINIC APP - PRODUCTION CLEAN REBUILD
echo ===============================================
echo.
echo This script will:
echo - Stop all containers
echo - Remove old images and build cache
echo - Rebuild all services with production fixes
echo - Start services in production mode
echo.
pause

echo.
echo 📋 STEP 1: Stopping all containers...
docker compose down

echo.
echo 🧹 STEP 2: Cleaning Docker system...
docker system prune -f
docker builder prune -f

echo.
echo 🗑️ STEP 3: Removing old images...
docker image rm -f $(docker images -q clinic-app-* 2>nul) 2>nul

echo.
echo 🔧 STEP 4: Building common library with fixes...
cd libs\common
call npm run build
if errorlevel 1 (
    echo ❌ FAILED: Common library build failed
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo ✅ Common library built successfully

echo.
echo 🏗️ STEP 5: Building all services (this may take 10-15 minutes)...
docker compose build --no-cache
if errorlevel 1 (
    echo ❌ FAILED: Docker build failed
    pause
    exit /b 1
)
echo ✅ All services built successfully

echo.
echo 🚀 STEP 6: Starting infrastructure services first...
docker compose up -d postgres redis nats minio maildev
if errorlevel 1 (
    echo ❌ FAILED: Infrastructure services startup failed
    pause
    exit /b 1
)
echo ✅ Infrastructure services started

echo.
echo ⏰ STEP 7: Waiting for infrastructure to be ready...
timeout /t 30 /nobreak >nul

echo.
echo 📱 STEP 8: Starting core application services...
docker compose up -d auth-service files-service notes-service client-relationships-service
if errorlevel 1 (
    echo ❌ FAILED: Core services startup failed
    pause
    exit /b 1
)
echo ✅ Core services started

echo.
echo ⏰ STEP 9: Waiting for core services...
timeout /t 20 /nobreak >nul

echo.
echo 🌐 STEP 10: Starting web services...
docker compose up -d frontend nginx

echo.
echo ⏰ STEP 11: Waiting for web services...
timeout /t 15 /nobreak >nul

echo.
echo 📊 STEP 12: Starting business services...
docker compose up -d appointments-service analytics-service settings-service notifications-service billing-service

echo.
echo ⏰ STEP 13: Final startup wait...
timeout /t 30 /nobreak >nul

echo.
echo ✅ STEP 14: Verifying all services...
echo Testing service health endpoints:
echo.

curl -s http://127.0.0.1:3001/health >nul && echo ✅ Auth Service (3001) - WORKING || echo ❌ Auth Service - DOWN
curl -s http://127.0.0.1:3003/health >nul && echo ✅ Files Service (3003) - WORKING || echo ❌ Files Service - DOWN  
curl -s http://127.0.0.1:3006/health >nul && echo ✅ Notes Service (3006) - WORKING || echo ❌ Notes Service - DOWN
curl -s http://127.0.0.1:3014/health >nul && echo ✅ Client Relationships (3014) - WORKING || echo ❌ Client Relationships - DOWN
curl -s http://127.0.0.1:3002/health >nul && echo ✅ Appointments Service (3002) - WORKING || echo ❌ Appointments - DOWN
curl -s http://127.0.0.1:3007/health >nul && echo ✅ Analytics Service (3007) - WORKING || echo ❌ Analytics - DOWN
curl -s http://127.0.0.1:3008/health >nul && echo ✅ Settings Service (3008) - WORKING || echo ❌ Settings - DOWN
curl -s http://127.0.0.1:3004/health >nul && echo ✅ Notifications Service (3004) - WORKING || echo ❌ Notifications - DOWN
curl -s http://127.0.0.1:3009/health >nul && echo ✅ Billing Service (3009) - WORKING || echo ❌ Billing - DOWN
curl -s http://127.0.0.1:4000/health >nul && echo ✅ API Gateway (4000) - WORKING || echo ❌ API Gateway - DOWN

echo.
echo 📋 STEP 15: Container status overview...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo ===============================================
echo 🎉 PRODUCTION REBUILD COMPLETE!
echo ===============================================
echo.
echo 🌐 Access URLs:
echo - Frontend: http://localhost:5173
echo - API Gateway: http://localhost:4000
echo - Database Admin: http://localhost:5432 (PostgreSQL)
echo - File Storage: http://localhost:9001 (MinIO Console)
echo.
echo 📊 Next Steps:
echo 1. Verify all services are healthy above
echo 2. Test login functionality at http://localhost:5173
echo 3. Check logs: docker logs [service-name]
echo 4. Monitor: docker compose logs -f
echo.
pause