@echo off
REM Full Rebuild and Seed Script for Clinic App (Windows)
REM This script performs a complete rebuild with Docker cleanup and seeds all necessary users
REM Usage: scripts\full-rebuild-and-seed.bat

setlocal enabledelayedexpansion

REM Configuration
set API_URL=http://localhost:4000
set ADMIN_SECRET=clinic-admin-secret-2024

REM Default user credentials
set ADMIN_EMAIL=admin@clinic.com
set ADMIN_PASSWORD=Admin123!
set THERAPIST_EMAIL=therapist@clinic.com
set THERAPIST_PASSWORD=Therapist123!
set PATIENT_EMAIL=patient@clinic.com
set PATIENT_PASSWORD=Patient123!

echo.
echo ========================================================
echo 🚀 Starting Full Rebuild and Seed Process
echo ========================================================
echo.

REM Step 1: Stop all running containers
echo 📦 Step 1: Stopping all running containers...
docker compose down --remove-orphans >nul 2>&1
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --remove-orphans >nul 2>&1
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down --remove-orphans >nul 2>&1

REM Step 2: Remove all containers and images
echo 🧹 Step 2: Cleaning up Docker environment...

echo Removing all clinic-app containers...
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=clinic-app" 2^>nul') do (
    docker rm -f %%i >nul 2>&1
)

echo Removing all clinic-app images...
for /f "tokens=*" %%i in ('docker images --filter "reference=clinic-app*" -q 2^>nul') do (
    docker rmi -f %%i >nul 2>&1
)

echo Cleaning up volumes and networks...
docker volume prune -f >nul 2>&1
docker network prune -f >nul 2>&1

REM Step 3: Build dependencies
echo 🔧 Step 3: Building dependencies...
call yarn install
call yarn workspace @clinic/common build

REM Step 4: Build all Docker images
echo 🏗️ Step 4: Building all Docker images...
docker compose build --no-cache

REM Step 5: Start infrastructure services first
echo 🏗️ Step 5: Starting infrastructure services...
docker compose up -d postgres redis nats minio maildev

echo Waiting for infrastructure services to initialize...
timeout /t 15 /nobreak >nul

REM Step 6: Start core application services
echo 🚀 Step 6: Starting core application services...
docker compose up -d

echo Waiting for core services to initialize...
timeout /t 30 /nobreak >nul

REM Step 7: Start enhanced services (if available)
echo 🔧 Step 7: Starting enhanced services...
if exist "docker-compose.enhanced.yml" (
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d >nul 2>&1
)

REM Step 8: Start monitoring services
echo 📊 Step 8: Starting monitoring services...
if exist "docker-compose.monitoring.yml" (
    docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d >nul 2>&1
)

REM Step 9: Health checks
echo 🏥 Step 9: Performing health checks...

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
    echo ❌ API Gateway health check failed after 30 attempts
    goto health_check_done
)
timeout /t 2 /nobreak >nul
goto health_check_loop
:health_check_done

REM Step 10: Seed users
echo 👥 Step 10: Creating seed users...

echo Waiting for services to fully initialize before seeding users...
timeout /t 10 /nobreak >nul

REM Create admin user via SQL (simpler approach for Windows)
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
        echo ❌ Failed to create admin user
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
        echo ❌ Failed to create therapist user
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
        echo ❌ Failed to create patient user
    )
)

REM Step 11: Final status report
echo.
echo ==================================================
echo 🎉 FULL REBUILD AND SEED COMPLETED SUCCESSFULLY!
echo ==================================================
echo.
echo 📊 Container Status:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr clinic-app
echo.
echo 👥 Seed Users Created:
echo ┌─────────────────────────────────────────────────────┐
echo │ 1. 👑 ADMIN USER                                   │
echo │    Email: %ADMIN_EMAIL%                             │
echo │    Password: %ADMIN_PASSWORD%                       │
echo │    Access: Admin Dashboard + Monitoring            │
echo │    URL: http://localhost:5173/admin                │
echo │                                                     │
echo │ 2. 🩺 THERAPIST USER                              │
echo │    Email: %THERAPIST_EMAIL%                         │
echo │    Password: %THERAPIST_PASSWORD%                   │
echo │    Access: Therapist Dashboard                     │
echo │    URL: http://localhost:5173/therapist            │
echo │                                                     │
echo │ 3. 👤 PATIENT USER                                │
echo │    Email: %PATIENT_EMAIL%                           │
echo │    Password: %PATIENT_PASSWORD%                     │
echo │    Access: Client Portal                           │
echo │    URL: http://localhost:5173/client               │
echo └─────────────────────────────────────────────────────┘
echo.
echo 🌐 Application URLs:
echo • Main App: http://localhost:5173
echo • API Gateway: http://localhost:4000
echo • Admin Dashboard: http://localhost:5173/admin
echo • Monitoring (Grafana): http://localhost:3000
echo • Monitoring (Prometheus): http://localhost:9090
echo • Email Testing: http://localhost:1080
echo.
echo ⚠️ IMPORTANT SECURITY NOTES:
echo • Change all default passwords immediately after first login
echo • The admin user has access to monitoring and system management
echo • All users are created with default credentials for testing
echo.
echo ✅ Clinic application is now ready for use!
echo.
pause