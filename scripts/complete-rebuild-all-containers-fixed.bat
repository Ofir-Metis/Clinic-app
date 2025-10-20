@echo off
REM Complete System Rebuild Script for Clinic App - Fixed Version
REM This script performs a complete teardown and rebuild of the entire system

setlocal enabledelayedexpansion

REM Navigate to project root
cd /d "%~dp0\.."

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
echo COMPLETE SYSTEM REBUILD - CLINIC APP
echo ==================================================================
echo.

REM PHASE 1: COMPLETE TEARDOWN
echo.
echo PHASE 1: COMPLETE TEARDOWN AND CLEANUP
echo --------------------------------------------------

echo Stopping all Docker Compose stacks...
docker compose down --remove-orphans 2>nul
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --remove-orphans 2>nul
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down --remove-orphans 2>nul

echo Removing all clinic-app containers...
for /f "tokens=*" %%i in ('docker ps -aq --filter "name=clinic-app" 2^>nul') do (
    docker rm -f %%i 2>nul
)

echo Cleaning up Docker build cache...
docker builder prune -f 2>nul

echo [OK] Complete teardown finished!

REM PHASE 2: DEPENDENCIES AND PRE-BUILD
echo.
echo PHASE 2: DEPENDENCIES AND PRE-BUILD SETUP
echo --------------------------------------------------

echo Installing Node.js dependencies...
call yarn install

echo Building @clinic/common library...
call yarn workspace "@clinic/common" build

echo Creating Docker networks...
docker network create clinic-network 2>nul

echo [OK] Dependencies ready!

REM PHASE 3: BUILD ALL IMAGES
echo.
echo PHASE 3: BUILDING ALL DOCKER IMAGES
echo --------------------------------------------------
echo This may take 10-15 minutes...

echo Building main application images...
docker compose build

if !errorlevel! neq 0 (
    echo [ERROR] Docker build failed. Check the error messages above.
    echo.
    echo Common fixes:
    echo 1. Restart Docker Desktop
    echo 2. Run: docker system prune -a -f
    echo 3. Check Docker Desktop settings - ensure enough memory allocated
    pause
    exit /b 1
)

echo [OK] All images built successfully!

REM PHASE 4: START INFRASTRUCTURE
echo.
echo PHASE 4: STARTING INFRASTRUCTURE SERVICES
echo --------------------------------------------------

echo Starting core infrastructure...
docker compose up -d postgres redis nats minio maildev

echo Waiting for infrastructure to initialize...
timeout /t 15 /nobreak >nul

echo [OK] Infrastructure started!

REM PHASE 5: START MAIN APPLICATION SERVICES
echo.
echo PHASE 5: STARTING MAIN APPLICATION SERVICES
echo --------------------------------------------------

echo Starting all main application services...
docker compose up -d

echo Waiting for main services to initialize...
timeout /t 30 /nobreak >nul

echo [OK] Main services started!

REM PHASE 6: HEALTH VERIFICATION
echo.
echo PHASE 6: VERIFYING SERVICE HEALTH
echo --------------------------------------------------

echo Checking API Gateway health...
set /a attempts=0
:health_check_loop
set /a attempts+=1
curl -s http://localhost:4000/health >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] API Gateway is healthy!
    goto health_check_done
)
if !attempts! geq 30 (
    echo [WARNING] API Gateway health check failed after 30 attempts
    goto health_check_done
)
timeout /t 2 /nobreak >nul
goto health_check_loop
:health_check_done

echo Testing other critical services...
curl -s http://localhost:5173 >nul 2>&1 && echo [OK] Frontend is responding || echo [WARNING] Frontend check failed
curl -s http://localhost:9200/_cluster/health >nul 2>&1 && echo [OK] Elasticsearch is responding || echo [INFO] Elasticsearch not in main compose

REM PHASE 7: USER SEEDING
echo.
echo PHASE 7: SEEDING DEFAULT USERS
echo --------------------------------------------------

echo Waiting for database to be fully ready...
timeout /t 10 /nobreak >nul

REM Check if psql is available
where psql >nul 2>&1
if !errorlevel! neq 0 (
    echo [WARNING] PostgreSQL client 'psql' not found in PATH
    echo [INFO] Users will need to be created manually or install PostgreSQL client tools
    goto skip_user_seeding
)

REM Create admin user with proper SQL syntax
echo Creating admin user...
set "ADMIN_SQL=INSERT INTO \"user\" (email, name, password, role) VALUES ('%ADMIN_EMAIL%', 'System Administrator', crypt('%ADMIN_PASSWORD%', gen_salt('bf', 12)), 'admin') ON CONFLICT (email) DO NOTHING;"

set PGPASSWORD=postgres
echo %ADMIN_SQL% | psql -h localhost -p 5432 -U postgres -d clinic >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Admin user created: %ADMIN_EMAIL% / %ADMIN_PASSWORD%
) else (
    echo [INFO] Admin user creation failed or already exists
)

REM Create therapist user
echo Creating therapist user...
set "THERAPIST_SQL=INSERT INTO \"user\" (email, name, password, role) VALUES ('%THERAPIST_EMAIL%', 'Dr. Sarah Wilson', crypt('%THERAPIST_PASSWORD%', gen_salt('bf', 12)), 'therapist') ON CONFLICT (email) DO NOTHING;"

set PGPASSWORD=postgres
echo %THERAPIST_SQL% | psql -h localhost -p 5432 -U postgres -d clinic >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Therapist user created: %THERAPIST_EMAIL% / %THERAPIST_PASSWORD%
) else (
    echo [INFO] Therapist user creation failed or already exists
)

REM Create patient user
echo Creating patient user...
set "PATIENT_SQL=INSERT INTO \"user\" (email, name, password, role) VALUES ('%PATIENT_EMAIL%', 'John Doe', crypt('%PATIENT_PASSWORD%', gen_salt('bf', 12)), 'client') ON CONFLICT (email) DO NOTHING;"

set PGPASSWORD=postgres
echo %PATIENT_SQL% | psql -h localhost -p 5432 -U postgres -d clinic >nul 2>&1
if !errorlevel! equ 0 (
    echo [OK] Patient user created: %PATIENT_EMAIL% / %PATIENT_PASSWORD%
) else (
    echo [INFO] Patient user creation failed or already exists
)

:skip_user_seeding

REM PHASE 8: FINAL STATUS REPORT
echo.
echo PHASE 8: FINAL STATUS REPORT
echo --------------------------------------------------
echo.

echo ==================================================================
echo REBUILD FINISHED!
echo ==================================================================
echo.

echo CONTAINER STATUS:
for /f %%i in ('docker ps --filter "name=clinic-app" --format "{{.Names}}" ^| find /c /v ""') do set RUNNING_COUNT=%%i
for /f %%i in ('docker ps -a --filter "name=clinic-app" --format "{{.Names}}" ^| find /c /v ""') do set TOTAL_COUNT=%%i

echo - Total Containers: !TOTAL_COUNT!
echo - Running Containers: !RUNNING_COUNT!
echo.

echo RUNNING CONTAINERS:
docker ps --filter "name=clinic-app" --format "table {{.Names}}\t{{.Status}}"
echo.

echo ACCESS URLS:
echo - Main Application: http://localhost:5173
echo - API Gateway: http://localhost:4000
echo - API Documentation: http://localhost:4000/api-docs
echo - Database (PostgreSQL): localhost:5432
echo - Email Testing (MailDev): http://localhost:1080
echo.

echo DEFAULT USERS (if seeding succeeded):
echo - ADMIN: %ADMIN_EMAIL% / %ADMIN_PASSWORD%
echo - THERAPIST: %THERAPIST_EMAIL% / %THERAPIST_PASSWORD%
echo - PATIENT: %PATIENT_EMAIL% / %PATIENT_PASSWORD%
echo.

REM Check for failed containers
for /f %%i in ('docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "{{.Names}}" ^| find /c /v ""') do set FAILED_COUNT=%%i

if !FAILED_COUNT! gtr 0 (
    echo [WARNING] Some containers have exited:
    docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
    echo.
    echo To check logs: docker logs ^<container-name^>
    echo.
)

echo [OK] System rebuild complete!
echo.

echo USEFUL COMMANDS:
echo - Check all containers: docker ps --filter "name=clinic-app"
echo - Check logs: docker logs clinic-app-^<service-name^>-1
echo - Restart a service: docker compose restart ^<service-name^>
echo - Stop everything: docker compose down
echo.

pause
