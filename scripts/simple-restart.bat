@echo off
REM Simple Restart Script - For recovering from failed builds
REM Use this if the complete rebuild had issues

setlocal enabledelayedexpansion

REM Navigate to project root
cd /d "%~dp0\.."

echo.
echo ==================================================================
echo SIMPLE RESTART - CLINIC APP
echo ==================================================================
echo.

echo Step 1: Stopping all containers...
docker compose down 2>nul

echo Step 2: Starting infrastructure...
docker compose up -d postgres redis nats minio maildev

echo Waiting 10 seconds for infrastructure...
timeout /t 10 /nobreak >nul

echo Step 3: Starting all application services...
docker compose up -d

echo Waiting 20 seconds for services to start...
timeout /t 20 /nobreak >nul

echo.
echo ==================================================================
echo STATUS CHECK
echo ==================================================================
echo.

echo Running containers:
docker ps --filter "name=clinic-app" --format "table {{.Names}}\t{{.Status}}"

echo.
echo Access URLs:
echo - Frontend: http://localhost:5173
echo - API Gateway: http://localhost:4000
echo - API Docs: http://localhost:4000/api-docs
echo.

echo Checking service health...
curl -s http://localhost:4000/health >nul 2>&1 && echo [OK] API Gateway is healthy || echo [WARNING] API Gateway not responding
curl -s http://localhost:5173 >nul 2>&1 && echo [OK] Frontend is responding || echo [WARNING] Frontend not responding

echo.
echo To check logs of a specific service:
echo docker logs clinic-app-^<service-name^>-1
echo.
echo Example: docker logs clinic-app-api-gateway-1
echo.

pause
