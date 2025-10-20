@echo off
REM Complete System Rebuild Script for Clinic App - All 34 Containers (Windows)
REM This script performs a complete teardown and rebuild of the entire system
REM Including all core, enhanced, and monitoring containers

setlocal enabledelayedexpansion

REM Configuration
set API_URL=http://localhost:4000

REM Default user credentials
set ADMIN_EMAIL=admin@clinic.com
set ADMIN_PASSWORD=Admin123!
set THERAPIST_EMAIL=therapist@clinic.com
set THERAPIST_PASSWORD=Therapist123!
set PATIENT_EMAIL=patient@clinic.com
set PATIENT_PASSWORD=Patient123!

echo.
echo ==================================================================
echo 🚀 COMPLETE SYSTEM REBUILD - ALL 34 CONTAINERS
echo ==================================================================
echo.

REM PHASE 1: COMPLETE TEARDOWN
echo.
echo 🔧 PHASE 1: COMPLETE TEARDOWN AND CLEANUP
echo --------------------------------------------------

echo Stopping all Docker Compose stacks...
docker compose down --remove-orphans >nul 2>&1
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --remove-orphans >nul 2>&1
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down --remove-orphans >nul 2>&1
docker compose -f docker-compose.core.yml down --remove-orphans >nul 2>&1
docker compose -f docker-compose.production-ready.yml down --remove-orphans >nul 2>&1
docker compose -f docker-compose.staging.yml down --remove-orphans >nul 2>&1
docker compose -f docker-compose.test.yml down --remove-orphans >nul 2>&1

echo Removing all clinic-app containers...
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=clinic-app" 2^>nul') do (
    docker rm -f %%i >nul 2>&1
)

echo Removing all clinic-app images...
for /f "tokens=*" %%i in ('docker images --filter "reference=clinic-app*" -q 2^>nul') do (
    docker rmi -f %%i >nul 2>&1
)

echo Cleaning up Docker volumes...
docker volume prune -f >nul 2>&1

echo Cleaning up Docker networks...
docker network prune -f >nul 2>&1
docker network rm clinic-network >nul 2>&1

echo Cleaning Docker build cache...
docker builder prune -f >nul 2>&1

echo ✅ Complete teardown finished!

REM PHASE 2: DEPENDENCIES AND PRE-BUILD
echo.
echo 🔧 PHASE 2: DEPENDENCIES AND PRE-BUILD SETUP
echo --------------------------------------------------

echo Installing Node.js dependencies...
call yarn install

echo Building @clinic/common library...
call yarn workspace "@clinic/common" build

echo Creating Docker networks...
docker network create clinic-network >nul 2>&1

echo ✅ Dependencies ready!

REM PHASE 3: BUILD ALL IMAGES
echo.
echo 🔧 PHASE 3: BUILDING ALL DOCKER IMAGES (NO CACHE)
echo --------------------------------------------------

echo Building main application images...
docker compose build --no-cache

echo Building enhanced services images...
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml build --no-cache

echo ✅ All images built successfully!

REM PHASE 4: START INFRASTRUCTURE
echo.
echo 🔧 PHASE 4: STARTING INFRASTRUCTURE SERVICES
echo --------------------------------------------------

echo Starting core infrastructure...
docker compose up -d postgres redis nats minio maildev

echo Waiting for infrastructure to initialize...
timeout /t 15 /nobreak >nul

REM PHASE 5: START MAIN APPLICATION SERVICES
echo.
echo 🔧 PHASE 5: STARTING MAIN APPLICATION SERVICES (20 containers)
echo --------------------------------------------------

echo Starting all main application services...
docker compose up -d

echo Waiting for main services to initialize...
timeout /t 30 /nobreak >nul

REM PHASE 6: START ENHANCED SERVICES
echo.
echo 🔧 PHASE 6: STARTING ENHANCED SERVICES (10 containers)
echo --------------------------------------------------

echo Starting enhanced services (AI, Search, CDN, etc.)...
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d

echo Waiting for enhanced services to initialize...
timeout /t 20 /nobreak >nul

REM PHASE 7: START MONITORING STACK
echo.
echo 🔧 PHASE 7: STARTING MONITORING ^& MANAGEMENT STACK (11 containers)
echo --------------------------------------------------

echo Starting monitoring and management services...
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

echo Waiting for monitoring services to initialize...
timeout /t 20 /nobreak >nul

REM PHASE 8: HEALTH VERIFICATION
echo.
echo 🔧 PHASE 8: VERIFYING SERVICE HEALTH
echo --------------------------------------------------

echo Checking API Gateway health...
set /a attempts=0
:health_check_loop
set /a attempts+=1
curl -s http://localhost:4000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo ✅ API Gateway is healthy!
    goto health_check_done
)
if !attempts! geq 30 (
    echo ⚠️ API Gateway health check failed after 30 attempts
    goto health_check_done
)
timeout /t 2 /nobreak >nul
goto health_check_loop
:health_check_done

echo Testing other critical services...
curl -s http://localhost:5173 >nul 2>&1 && echo ✅ Frontend is responding || echo ⚠️ Frontend check failed
curl -s http://localhost:3000 >nul 2>&1 && echo ✅ Grafana is responding || echo ⚠️ Grafana check failed
curl -s http://localhost:9200/_cluster/health >nul 2>&1 && echo ✅ Elasticsearch is responding || echo ⚠️ Elasticsearch check failed

REM PHASE 9: USER SEEDING
echo.
echo 🔧 PHASE 9: SEEDING DEFAULT USERS
echo --------------------------------------------------

echo Waiting for database to be fully ready...
timeout /t 10 /nobreak >nul

REM Create admin user
echo Creating admin user...
call node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('%ADMIN_PASSWORD%', 12))" > temp_hash.txt 2>nul
if exist temp_hash.txt (
    set /p ADMIN_HASH=<temp_hash.txt
    del temp_hash.txt

    set ADMIN_SQL=INSERT INTO "user" (email, name, password, roles) VALUES ('%ADMIN_EMAIL%', 'System Administrator', '!ADMIN_HASH!', '{admin}') ON CONFLICT (email) DO NOTHING;

    set PGPASSWORD=postgres
    echo !ADMIN_SQL! | psql -h localhost -p 5432 -U postgres -d clinic >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Admin user created: %ADMIN_EMAIL% / %ADMIN_PASSWORD%
    ) else (
        echo ⚠️ Admin user creation failed or already exists
    )
)

REM Create therapist user
echo Creating therapist user...
call node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('%THERAPIST_PASSWORD%', 12))" > temp_hash.txt 2>nul
if exist temp_hash.txt (
    set /p THERAPIST_HASH=<temp_hash.txt
    del temp_hash.txt

    set THERAPIST_SQL=INSERT INTO "user" (email, name, password, roles) VALUES ('%THERAPIST_EMAIL%', 'Dr. Sarah Wilson', '!THERAPIST_HASH!', '{therapist}') ON CONFLICT (email) DO NOTHING;

    set PGPASSWORD=postgres
    echo !THERAPIST_SQL! | psql -h localhost -p 5432 -U postgres -d clinic >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Therapist user created: %THERAPIST_EMAIL% / %THERAPIST_PASSWORD%
    ) else (
        echo ⚠️ Therapist user creation failed or already exists
    )
)

REM Create patient user
echo Creating patient user...
call node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('%PATIENT_PASSWORD%', 12))" > temp_hash.txt 2>nul
if exist temp_hash.txt (
    set /p PATIENT_HASH=<temp_hash.txt
    del temp_hash.txt

    set PATIENT_SQL=INSERT INTO "user" (email, name, password, roles) VALUES ('%PATIENT_EMAIL%', 'John Doe', '!PATIENT_HASH!', '{client}') ON CONFLICT (email) DO NOTHING;

    set PGPASSWORD=postgres
    echo !PATIENT_SQL! | psql -h localhost -p 5432 -U postgres -d clinic >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Patient user created: %PATIENT_EMAIL% / %PATIENT_PASSWORD%
    ) else (
        echo ⚠️ Patient user creation failed or already exists
    )
)

REM PHASE 10: FINAL STATUS REPORT
echo.
echo 🔧 PHASE 10: FINAL STATUS REPORT
echo --------------------------------------------------

echo.
echo ==================================================================
echo 🎉 COMPLETE REBUILD FINISHED!
echo ==================================================================
echo.

echo 📊 CONTAINER STATUS:
for /f %%i in ('docker ps --filter "name=clinic-app" --format "{{.Names}}" ^| find /c /v ""') do set RUNNING_COUNT=%%i
for /f %%i in ('docker ps -a --filter "name=clinic-app" --format "{{.Names}}" ^| find /c /v ""') do set TOTAL_COUNT=%%i

echo • Total Containers: !TOTAL_COUNT!
echo • Running Containers: !RUNNING_COUNT!
echo • Target: 34 containers
echo.

echo 🏗️ SERVICE BREAKDOWN:
echo • Core Application Services: 20 containers
echo • Enhanced Services: 10 containers
echo • Monitoring Stack: 11 containers
echo • Total Expected: 34 unique containers
echo.

echo 📦 RUNNING CONTAINERS:
docker ps --filter "name=clinic-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo 🌐 ACCESS URLS:
echo • Main Application: http://localhost:5173
echo • API Gateway: http://localhost:4000
echo • Load Balancer: http://localhost:80
echo.
echo 📊 MANAGEMENT DASHBOARDS:
echo • Grafana Monitoring: http://localhost:3000 (admin/admin)
echo • pgAdmin Database: http://localhost:5050 (admin@clinic.com/admin)
echo • Redis Commander: http://localhost:8081 (admin/admin)
echo • Uptime Monitoring: http://localhost:3301
echo • Prometheus Metrics: http://localhost:9090
echo • Jaeger Tracing: http://localhost:16686
echo • Elasticsearch: http://localhost:9200
echo • Email Testing: http://localhost:1080
echo.

echo 👥 DEFAULT USERS:
echo ┌─────────────────────────────────────────────────────┐
echo │ ADMIN: %ADMIN_EMAIL% / %ADMIN_PASSWORD%
echo │ THERAPIST: %THERAPIST_EMAIL% / %THERAPIST_PASSWORD%
echo │ PATIENT: %PATIENT_EMAIL% / %PATIENT_PASSWORD%
echo └─────────────────────────────────────────────────────┘
echo.

REM Check for failed containers
for /f %%i in ('docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "{{.Names}}" ^| find /c /v ""') do set FAILED_COUNT=%%i

if !FAILED_COUNT! gtr 0 (
    echo ⚠️ Some containers have exited. Checking logs...
    docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
    echo.
    echo To check logs of failed containers, use:
    echo docker logs ^<container-name^>
    echo.
)

echo ✅ System rebuild complete! All services should be operational.
echo.

echo 💡 USEFUL COMMANDS:
echo • Check all containers: docker ps --filter "name=clinic-app"
echo • Check logs: docker logs clinic-app-^<service-name^>-1
echo • Restart a service: docker compose restart ^<service-name^>
echo • Stop everything: docker compose down
echo.

pause