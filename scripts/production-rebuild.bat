@echo off
setlocal EnableDelayedExpansion

REM #########################################################
REM 🏗️ CLINIC APP - LOCAL PRODUCTION REBUILD SCRIPT (Windows)
REM #########################################################

echo.
echo 🏗️ ===============================================
echo    CLINIC APP - LOCAL PRODUCTION REBUILD
echo    Starting comprehensive deployment process...
echo ===============================================
echo.

REM Configuration
set "PROJECT_ROOT=%~dp0.."
set "ENHANCED_MODE=false"
set "KEEP_DATA=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :start_deployment
if /i "%~1"=="--enhanced" set "ENHANCED_MODE=true"
if /i "%~1"=="--keep-data" set "KEEP_DATA=true"
if /i "%~1"=="--help" goto :show_help
shift
goto :parse_args

:show_help
echo.
echo 🏗️  Clinic App - Local Production Rebuild Script (Windows)
echo.
echo USAGE:
echo     scripts\production-rebuild.bat [OPTIONS]
echo.
echo OPTIONS:
echo     --enhanced      Include enhanced services (AI, Search, CDN)
echo     --keep-data     Keep existing database data
echo     --help          Show this help message
echo.
echo EXAMPLES:
echo     scripts\production-rebuild.bat                    # Full production rebuild
echo     scripts\production-rebuild.bat --enhanced         # With enhanced services
echo     scripts\production-rebuild.bat --keep-data        # Keep existing data
echo.
goto :eof

:start_deployment
cd /d "%PROJECT_ROOT%"

echo Configuration:
echo - Enhanced Mode: !ENHANCED_MODE!
echo - Keep Data: !KEEP_DATA!
echo - Project Root: %PROJECT_ROOT%
echo.

REM Step 1: Check Prerequisites
echo 🚀 Step 1: Checking prerequisites...
call :check_prerequisites
if errorlevel 1 goto :error_exit

REM Step 2: Cleanup Environment
echo.
echo 🚀 Step 2: Cleaning up existing environment...
call :cleanup_environment
if errorlevel 1 goto :error_exit

REM Step 3: Setup Environment Files
echo.
echo 🚀 Step 3: Setting up environment files...
call :setup_environment_files
if errorlevel 1 goto :error_exit

REM Step 4: Install Dependencies
echo.
echo 🚀 Step 4: Installing dependencies...
call :install_dependencies
if errorlevel 1 goto :error_exit

REM Step 5: Build Docker Services
echo.
echo 🚀 Step 5: Building Docker services...
call :build_docker_services
if errorlevel 1 goto :error_exit

REM Step 6: Start Infrastructure
echo.
echo 🚀 Step 6: Starting infrastructure services...
call :start_infrastructure
if errorlevel 1 goto :error_exit

REM Step 7: Start Application Services
echo.
echo 🚀 Step 7: Starting application services...
call :start_application_services
if errorlevel 1 goto :error_exit

REM Step 8: Health Checks
echo.
echo 🚀 Step 8: Running health checks...
call :test_service_health
if errorlevel 1 echo ⚠️  Some health checks failed, but deployment continues...

REM Success
echo.
echo 🎉 ===============================================
echo    DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ===============================================
echo.
echo 🔗 Access URLs:
echo    Frontend:        http://localhost:5173
echo    API Gateway:     http://localhost:4000
echo    API Docs:        http://localhost:4000/api-docs
echo    MinIO Console:   http://localhost:9001
echo    MailDev:         http://localhost:1080
echo.
echo 📊 Services Status:
docker compose ps
echo.
echo ✅ Deployment completed successfully!
goto :eof

REM #########################################################
REM FUNCTIONS
REM #########################################################

:check_prerequisites
echo ℹ️  Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 20+
    exit /b 1
)
echo ✅ Node.js found

echo ℹ️  Checking Yarn...
yarn --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Yarn not found. Please install: npm install -g yarn
    exit /b 1
)
echo ✅ Yarn found

echo ℹ️  Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker not found. Please install Docker Desktop
    exit /b 1
)
echo ✅ Docker found

echo ℹ️  Checking Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose not found. Please install Docker Desktop
    exit /b 1
)
echo ✅ Docker Compose found

echo ℹ️  Checking Docker is running...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop
    exit /b 1
)
echo ✅ Docker is running

echo ✅ All prerequisites satisfied
exit /b 0

:cleanup_environment
echo ℹ️  Stopping all containers...
docker compose down --timeout 30 >nul 2>&1
docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --timeout 30 >nul 2>&1

echo ℹ️  Cleaning up Docker images...
for /f "delims=" %%i in ('docker images --filter "reference=clinic-app*" -q 2^>nul') do (
    docker rmi -f %%i >nul 2>&1
)
docker image prune -f >nul 2>&1

if /i "!KEEP_DATA!"=="false" (
    echo ℹ️  Cleaning up Docker volumes...
    for /f "delims=" %%i in ('docker volume ls --filter "name=clinic-app" -q 2^>nul') do (
        docker volume rm %%i >nul 2>&1
    )
)

echo ✅ Environment cleanup completed
exit /b 0

:setup_environment_files
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ℹ️  Created .env from .env.example
    ) else (
        echo ℹ️  Creating minimal .env file...
        (
            echo NODE_ENV=production
            echo POSTGRES_HOST=localhost
            echo POSTGRES_PORT=5432
            echo POSTGRES_DB=clinic
            echo POSTGRES_USER=postgres
            echo POSTGRES_PASSWORD=postgres
            echo JWT_SECRET=clinic_jwt_production_ultra_secure_secret_key_2024_very_long
            echo NATS_URL=nats://localhost:4222
            echo REDIS_URL=redis://localhost:6379
            echo API_GATEWAY_PORT=4000
        ) > .env
    )
) else (
    echo ℹ️  Using existing .env file
)

echo ✅ Environment files configured
exit /b 0

:install_dependencies
echo ℹ️  Cleaning Yarn cache...
yarn cache clean

echo ℹ️  Installing root dependencies...
yarn install --frozen-lockfile --production=false
if errorlevel 1 (
    echo ❌ Failed to install root dependencies
    exit /b 1
)

echo ℹ️  Building @clinic/common library...
yarn workspace "@clinic/common" build
if errorlevel 1 (
    echo ❌ Failed to build @clinic/common library
    exit /b 1
)

if not exist "libs\common\dist" (
    echo ❌ @clinic/common build failed - dist directory not found
    exit /b 1
)

echo ℹ️  Installing frontend dependencies...
cd frontend
yarn install --frozen-lockfile
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    exit /b 1
)
cd ..

echo ✅ Dependencies installed and built
exit /b 0

:build_docker_services
echo ℹ️  Building Docker images (this may take several minutes)...

REM Core services
set "CORE_SERVICES=api-gateway auth-service appointments-service files-service notifications-service notes-service analytics-service settings-service billing-service therapists-service google-integration-service client-relationships-service"

for %%s in (%CORE_SERVICES%) do (
    echo ℹ️  Building %%s...
    docker compose build --no-cache %%s
    if errorlevel 1 (
        echo ❌ Failed to build %%s
        exit /b 1
    )
)

REM Enhanced services if requested
if /i "!ENHANCED_MODE!"=="true" (
    echo ℹ️  Building enhanced services...
    set "ENHANCED_SERVICES=ai-service search-service cdn-service progress-service"
    for %%s in (!ENHANCED_SERVICES!) do (
        echo ℹ️  Building %%s...
        docker compose -f docker-compose.yml -f docker-compose.enhanced.yml build --no-cache %%s
        if errorlevel 1 (
            echo ⚠️  Failed to build %%s, but continuing...
        )
    )
)

echo ✅ Docker services built successfully
exit /b 0

:start_infrastructure
set "INFRA_SERVICES=postgres redis nats minio maildev"

if /i "!ENHANCED_MODE!"=="true" (
    set "INFRA_SERVICES=!INFRA_SERVICES! elasticsearch"
)

echo ℹ️  Starting infrastructure: !INFRA_SERVICES!
docker compose up -d !INFRA_SERVICES!
if errorlevel 1 (
    echo ❌ Failed to start infrastructure services
    exit /b 1
)

echo ℹ️  Waiting for PostgreSQL to be ready...
set /a attempts=0
:wait_postgres
set /a attempts+=1
if %attempts% gtr 30 (
    echo ❌ PostgreSQL failed to start after 30 attempts
    exit /b 1
)

docker compose exec -T postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo ℹ️  Waiting for PostgreSQL... (attempt %attempts%/30)
    timeout /t 2 /nobreak >nul
    goto :wait_postgres
)

echo ✅ Infrastructure services started and ready
exit /b 0

:start_application_services
echo ℹ️  Starting application services in groups...

echo ℹ️  Starting group 1: auth-service, files-service, settings-service
docker compose up -d auth-service files-service settings-service
timeout /t 10 /nobreak >nul

echo ℹ️  Starting group 2: appointments-service, notes-service, notifications-service, analytics-service
docker compose up -d appointments-service notes-service notifications-service analytics-service
timeout /t 10 /nobreak >nul

echo ℹ️  Starting group 3: billing-service, therapists-service, google-integration-service, client-relationships-service
docker compose up -d billing-service therapists-service google-integration-service client-relationships-service
timeout /t 10 /nobreak >nul

echo ℹ️  Starting group 4: api-gateway
docker compose up -d api-gateway
timeout /t 10 /nobreak >nul

echo ℹ️  Starting group 5: frontend, nginx
docker compose up -d frontend nginx
timeout /t 10 /nobreak >nul

if /i "!ENHANCED_MODE!"=="true" (
    echo ℹ️  Starting enhanced services...
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d ai-service search-service cdn-service progress-service
)

echo ✅ Application services started
exit /b 0

:test_service_health
echo ℹ️  Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak >nul

echo ℹ️  Testing service health endpoints...

REM Test core services
set "SERVICES_PORTS=api-gateway:4000 auth-service:3001 appointments-service:3002 files-service:3003 notifications-service:3004 notes-service:3006 analytics-service:3007 settings-service:3008 billing-service:3009 therapists-service:3013 google-integration-service:3012 client-relationships-service:3014"

for %%s in (%SERVICES_PORTS%) do (
    for /f "tokens=1,2 delims=:" %%a in ("%%s") do (
        echo ℹ️  Testing %%a health check...
        curl -sf http://localhost:%%b/health >nul 2>&1
        if errorlevel 1 (
            echo ⚠️  %%a health check failed
        ) else (
            echo ✅ %%a health check passed
        )
    )
)

echo ✅ Health checks completed
exit /b 0

:error_exit
echo.
echo ❌ Deployment failed. Check the output above for details.
echo.
echo Troubleshooting:
echo - Check Docker Desktop is running
echo - Verify all prerequisites are installed
echo - Check logs: docker compose logs
echo.
exit /b 1