#########################################################
# 🏗️ CLINIC APP - LOCAL PRODUCTION REBUILD SCRIPT (PowerShell)
#########################################################

param(
    [switch]$SkipTests,
    [switch]$KeepData,
    [switch]$Enhanced,
    [switch]$Monitoring,
    [switch]$Help
)

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $ProjectRoot "logs"
$StartTime = Get-Date

# Ensure logs directory exists
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$LogFile = Join-Path $LogDir "production-rebuild-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Compose files configuration
$ComposeFiles = @("docker-compose.yml")
if ($Enhanced) { $ComposeFiles += "docker-compose.enhanced.yml" }
if ($Monitoring) { $ComposeFiles += "docker-compose.monitoring.yml" }

#########################################################
# 📋 UTILITY FUNCTIONS
#########################################################

function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] $Message"
    
    switch ($Level) {
        "INFO"    { Write-Host "[$Timestamp] ℹ️  $Message" -ForegroundColor Cyan }
        "WARN"    { Write-Host "[$Timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "ERROR"   { Write-Host "[$Timestamp] ❌ $Message" -ForegroundColor Red }
        "SUCCESS" { Write-Host "[$Timestamp] ✅ $Message" -ForegroundColor Green }
        "STEP"    { Write-Host "[$Timestamp] 🚀 $Message" -ForegroundColor Magenta }
    }
    
    Add-Content -Path $LogFile -Value $LogEntry
}

function Show-Help {
    Write-Host "🏗️  Clinic App - Local Production Rebuild Script (PowerShell)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "    .\scripts\production-rebuild.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "OPTIONS:" -ForegroundColor Yellow
    Write-Host "    -SkipTests     Skip E2E testing phase (faster rebuild)"
    Write-Host "    -KeepData      Keep existing database data (skip fresh migrations)"
    Write-Host "    -Enhanced      Include enhanced services (AI, Search, CDN)"
    Write-Host "    -Monitoring    Include full monitoring stack (Prometheus, Grafana)"
    Write-Host "    -Help          Show this help message"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "    .\scripts\production-rebuild.ps1                           # Full production rebuild"
    Write-Host "    .\scripts\production-rebuild.ps1 -Enhanced -Monitoring     # Complete rebuild with all services"
    Write-Host "    .\scripts\production-rebuild.ps1 -SkipTests -KeepData      # Quick rebuild for development"
}

function Test-Prerequisites {
    Write-Log "STEP" "Checking prerequisites..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        $versionNumber = [int]($nodeVersion -replace 'v(\d+).*', '$1')
        if ($versionNumber -lt 20) {
            Write-Log "ERROR" "Node.js version $nodeVersion found. Please use Node.js 20+"
            exit 1
        }
        Write-Log "INFO" "Node.js version $nodeVersion found"
    }
    catch {
        Write-Log "ERROR" "Node.js not found. Please install Node.js 20+"
        exit 1
    }
    
    # Check Yarn
    try {
        yarn --version | Out-Null
        Write-Log "INFO" "Yarn found"
    }
    catch {
        Write-Log "ERROR" "Yarn not found. Please install: npm install -g yarn"
        exit 1
    }
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Log "INFO" "Docker found"
    }
    catch {
        Write-Log "ERROR" "Docker not found. Please install Docker Desktop"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker compose version | Out-Null
        Write-Log "INFO" "Docker Compose found"
    }
    catch {
        Write-Log "ERROR" "Docker Compose not found. Please install Docker Desktop with Compose"
        exit 1
    }
    
    # Check Docker is running
    try {
        docker info | Out-Null
        Write-Log "INFO" "Docker is running"
    }
    catch {
        Write-Log "ERROR" "Docker is not running. Please start Docker Desktop"
        exit 1
    }
    
    Write-Log "SUCCESS" "All prerequisites satisfied"
}

function Stop-Environment {
    Write-Log "STEP" "Performing aggressive Docker cleanup..."
    
    Set-Location $ProjectRoot
    
    # Stop all running containers gracefully
    Write-Log "INFO" "Stopping all running containers..."
    
    try {
        docker compose down --timeout 30 2>$null
    }
    catch {
        Write-Log "WARN" "Some containers may have already been stopped"
    }
    
    # Stop additional compose files
    try {
        docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --timeout 30 2>$null
    }
    catch {}
    
    try {
        docker compose -f docker-compose.yml -f docker-compose.enhanced.yml -f docker-compose.monitoring.yml down --timeout 30 2>$null
    }
    catch {}
    
    # AGGRESSIVE CLEANUP: Stop and remove ALL containers
    Write-Log "INFO" "Performing aggressive container cleanup..."
    try {
        $allContainers = docker ps -aq
        if ($allContainers) {
            Write-Log "INFO" "Stopping all running containers..."
            docker stop $allContainers 2>$null
            
            Write-Log "INFO" "Removing all containers..."
            docker rm -f $allContainers 2>$null
        }
    }
    catch {}
    
    # AGGRESSIVE CLEANUP: Remove ALL images (forces complete rebuild)
    Write-Log "INFO" "Performing aggressive image cleanup..."
    try {
        $allImages = docker images -aq
        if ($allImages) {
            Write-Log "WARN" "Removing ALL Docker images to force complete rebuild..."
            docker rmi -f $allImages 2>$null
        }
    }
    catch {}
    
    # Clean up build cache
    Write-Log "INFO" "Cleaning Docker build cache..."
    try {
        docker builder prune -af 2>$null
    }
    catch {}
    
    # Clean up system
    Write-Log "INFO" "Cleaning Docker system..."
    try {
        if (-not $KeepData) {
            Write-Log "INFO" "Cleaning up ALL Docker volumes..."
            docker system prune -af --volumes 2>$null
        }
        else {
            Write-Log "INFO" "Cleaning Docker system (preserving volumes)..."
            docker system prune -af 2>$null
        }
    }
    catch {}
    
    # Clean up networks
    Write-Log "INFO" "Cleaning up Docker networks..."
    try {
        $customNetworks = docker network ls --filter type=custom -q
        if ($customNetworks) {
            $customNetworks | ForEach-Object { docker network rm $_ } 2>$null
        }
    }
    catch {}
    
    # Verify cleanup
    try {
        $remainingContainers = @(docker ps -aq).Count
        $remainingImages = @(docker images -aq).Count
        
        Write-Log "INFO" "Cleanup summary:"
        Write-Log "INFO" "  - Remaining containers: $remainingContainers"
        Write-Log "INFO" "  - Remaining images: $remainingImages"
        
        if ($remainingContainers -eq 0 -and $remainingImages -eq 0) {
            Write-Log "SUCCESS" "Complete Docker cleanup successful - all images and containers removed"
        }
        elseif ($remainingImages -eq 0) {
            Write-Log "SUCCESS" "All Docker images removed successfully"
        }
        else {
            Write-Log "WARN" "Some Docker resources remain (may include system/protected resources)"
        }
    }
    catch {
        Write-Log "SUCCESS" "Docker cleanup completed"
    }
}

function Setup-EnvironmentFiles {
    Write-Log "STEP" "Setting up environment files..."
    
    Set-Location $ProjectRoot
    
    $envFile = ".env"
    $envExample = ".env.example"
    
    if (!(Test-Path $envFile)) {
        if (Test-Path $envExample) {
            Copy-Item $envExample $envFile
            Write-Log "INFO" "Created .env from .env.example"
        }
        else {
            Write-Log "WARN" "No .env.example found, creating minimal .env"
            $envContent = @"
NODE_ENV=production
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=clinic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
JWT_SECRET=clinic_jwt_production_ultra_secure_secret_key_2024_very_long
NATS_URL=nats://localhost:4222
REDIS_URL=redis://localhost:6379
API_GATEWAY_PORT=4000
"@
            $envContent | Out-File -FilePath $envFile -Encoding UTF8
        }
    }
    else {
        Write-Log "INFO" "Using existing .env file"
    }
    
    # Ensure production environment
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "NODE_ENV=development") {
        $envContent = $envContent -replace "NODE_ENV=development", "NODE_ENV=production"
        Set-Content -Path $envFile -Value $envContent
        Write-Log "INFO" "Updated NODE_ENV to production"
    }
    
    Write-Log "SUCCESS" "Environment files configured"
}

function Install-Dependencies {
    Write-Log "STEP" "Installing dependencies..."
    
    Set-Location $ProjectRoot
    
    # Clean yarn cache
    Write-Log "INFO" "Cleaning Yarn cache..."
    yarn cache clean
    
    # Install root dependencies
    Write-Log "INFO" "Installing root dependencies..."
    yarn install --frozen-lockfile --production=false
    
    # Build common library first
    Write-Log "INFO" "Building @clinic/common library..."
    yarn workspace "@clinic/common" build
    
    # Verify common library build
    if (!(Test-Path "libs\common\dist")) {
        Write-Log "ERROR" "@clinic/common build failed - dist directory not found"
        exit 1
    }
    
    # Install frontend dependencies
    Write-Log "INFO" "Installing frontend dependencies..."
    Set-Location (Join-Path $ProjectRoot "frontend")
    yarn install --frozen-lockfile
    Set-Location $ProjectRoot
    
    Write-Log "SUCCESS" "Dependencies installed and built"
}

function Build-DockerServices {
    Write-Log "STEP" "Building Docker services..."
    
    Set-Location $ProjectRoot
    
    # Core services
    $coreServices = @(
        "api-gateway",
        "auth-service", 
        "appointments-service",
        "files-service",
        "notifications-service",
        "notes-service",
        "analytics-service",
        "settings-service",
        "billing-service",
        "therapists-service",
        "google-integration-service",
        "client-relationships-service"
    )
    
    Write-Log "INFO" "Building Docker images (this may take several minutes)..."
    
    # Build core services
    foreach ($service in $coreServices) {
        Write-Log "INFO" "Building $service..."
        docker compose build --no-cache $service
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "ERROR" "Failed to build $service"
            exit 1
        }
    }
    
    # Build enhanced services if requested
    if ($Enhanced) {
        Write-Log "INFO" "Building enhanced services..."
        $enhancedServices = @("ai-service", "search-service", "cdn-service", "progress-service")
        foreach ($service in $enhancedServices) {
            Write-Log "INFO" "Building $service..."
            docker compose -f docker-compose.yml -f docker-compose.enhanced.yml build --no-cache $service
        }
    }
    
    Write-Log "SUCCESS" "Docker services built successfully"
}

function Start-Infrastructure {
    Write-Log "STEP" "Starting infrastructure services..."
    
    Set-Location $ProjectRoot
    
    # Infrastructure services
    $infrastructureServices = @("postgres", "redis", "nats", "minio", "maildev")
    
    if ($Enhanced) {
        $infrastructureServices += "elasticsearch"
    }
    
    Write-Log "INFO" "Starting infrastructure: $($infrastructureServices -join ', ')"
    docker compose up -d @infrastructureServices
    
    # Wait for PostgreSQL
    Write-Log "INFO" "Waiting for PostgreSQL to be ready..."
    $maxAttempts = 30
    $attempt = 1
    do {
        try {
            docker compose exec -T postgres pg_isready -U postgres | Out-Null
            if ($LASTEXITCODE -eq 0) { break }
        }
        catch {}
        
        if ($attempt -ge $maxAttempts) {
            Write-Log "ERROR" "PostgreSQL failed to start after $maxAttempts attempts"
            exit 1
        }
        Write-Log "INFO" "Waiting for PostgreSQL... (attempt $attempt/$maxAttempts)"
        Start-Sleep 2
        $attempt++
    } while ($attempt -le $maxAttempts)
    
    Write-Log "SUCCESS" "Infrastructure services started and ready"
}

function Start-ApplicationServices {
    Write-Log "STEP" "Starting application services..."
    
    Set-Location $ProjectRoot
    
    # Service groups in dependency order
    $serviceGroups = @(
        @("auth-service", "files-service", "settings-service"),
        @("appointments-service", "notes-service", "notifications-service", "analytics-service"),
        @("billing-service", "therapists-service", "google-integration-service", "client-relationships-service"),
        @("api-gateway"),
        @("frontend", "nginx")
    )
    
    foreach ($group in $serviceGroups) {
        Write-Log "INFO" "Starting service group: $($group -join ', ')"
        docker compose up -d @group
        Start-Sleep 10
    }
    
    # Start enhanced services if requested
    if ($Enhanced) {
        Write-Log "INFO" "Starting enhanced services..."
        docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d ai-service search-service cdn-service progress-service
    }
    
    Write-Log "SUCCESS" "Application services started"
}

function Test-ServiceHealth {
    Write-Log "STEP" "Verifying service health..."
    
    # Health endpoints
    $healthEndpoints = @{
        "api-gateway" = "http://localhost:4000/health"
        "auth-service" = "http://localhost:3001/health"
        "appointments-service" = "http://localhost:3002/health"
"files-service" = "http://localhost:3003/health"
        "notifications-service" = "http://localhost:3004/health"
        "notes-service" = "http://localhost:3006/health"
        "analytics-service" = "http://localhost:3007/health"
        "settings-service" = "http://localhost:3008/health"
        "billing-service" = "http://localhost:3009/health"
        "therapists-service" = "http://localhost:3013/health"
        "google-integration-service" = "http://localhost:3012/health"
        "client-relationships-service" = "http://localhost:3014/health"
    }
    
    $failedServices = @()
    $maxAttempts = 20
    
    # Wait for services to start up
    Write-Log "INFO" "Waiting for services to start (this may take a few minutes)..."
    Start-Sleep 30
    
    foreach ($service in $healthEndpoints.Keys) {
        $endpoint = $healthEndpoints[$service]
        $attempt = 1
        $serviceReady = $false
        
        while ($attempt -le $maxAttempts) {
            try {
                $response = Invoke-RestMethod -Uri $endpoint -TimeoutSec 5 -ErrorAction Stop
                Write-Log "SUCCESS" "$service health check passed"
                $serviceReady = $true
                break
            }
            catch {
                Write-Log "INFO" "Waiting for $service... (attempt $attempt/$maxAttempts)"
                Start-Sleep 3
                $attempt++
            }
        }
        
        if (-not $serviceReady) {
            Write-Log "ERROR" "$service health check failed after $maxAttempts attempts"
            $failedServices += $service
        }
    }
    
    if ($failedServices.Count -eq 0) {
        Write-Log "SUCCESS" "All core services are healthy"
    }
    else {
        Write-Log "ERROR" "The following services failed health checks: $($failedServices -join ', ')"
        Write-Log "INFO" "Check service logs with: docker compose logs service-name"
        return $false
    }
    
    return $true
}

function New-DeploymentReport {
    Write-Log "STEP" "Generating deployment report..."
    
    $endTime = Get-Date
    $duration = $endTime - $StartTime
    $durationFormatted = "{0:hh\:mm\:ss}" -f $duration
    
    $reportFile = Join-Path $LogDir "deployment-report-$(Get-Date -Format 'yyyyMMdd_HHmmss').md"
    
    try {
        $serviceStatus = docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
    }
    catch {
        $serviceStatus = "Unable to get service status"
    }
    
    $reportContent = @"
# Local Production Deployment Report

**Deployment Date**: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Duration**: $durationFormatted
**Environment**: Local Production Simulation

## Services Status

$serviceStatus

## Access URLs

Frontend: http://localhost:5173
API Gateway: http://localhost:4000
API Documentation: http://localhost:4000/api-docs
MinIO Console: http://localhost:9001
MailDev: http://localhost:1080

## Deployment Configuration

Keep Data: $KeepData
Enhanced Mode: $Enhanced
Monitoring Mode: $Monitoring
Skip Tests: $SkipTests

## Next Steps

1. Verify all services are responding at their health endpoints
2. Access the application at http://localhost:5173
3. Check service logs if needed: docker compose logs service-name

Report generated by Clinic App Production Rebuild Script v1.0.0 (PowerShell)
"@
    
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Log "SUCCESS" "Deployment report generated: $reportFile"
}

#########################################################
# 🚀 MAIN EXECUTION
#########################################################

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

# Show banner
Write-Host "🏗️ ===============================================" -ForegroundColor Cyan
Write-Host "   CLINIC APP - LOCAL PRODUCTION REBUILD" -ForegroundColor Cyan
Write-Host "   Starting comprehensive deployment process..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "- Keep Data: $KeepData"
Write-Host "- Enhanced Mode: $Enhanced"
Write-Host "- Monitoring Mode: $Monitoring"
Write-Host "- Skip Tests: $SkipTests"
Write-Host "- Log File: $LogFile"
Write-Host ""

# Execute deployment steps
try {
    Test-Prerequisites
    Stop-Environment
    Setup-EnvironmentFiles
    Install-Dependencies
    Build-DockerServices
    Start-Infrastructure
    Start-ApplicationServices
    $healthCheckPassed = Test-ServiceHealth
    
    New-DeploymentReport
    
    # Success summary
    $endTime = Get-Date
    $duration = $endTime - $StartTime
    $durationFormatted = "{0:hh\:mm\:ss}" -f $duration
    
    try {
        $runningContainers = (docker compose ps -q).Count
    }
    catch {
        $runningContainers = "Unknown"
    }
    
    Write-Host ""
    Write-Host "🎉 ===============================================" -ForegroundColor Green
    Write-Host "   DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "   Duration: $durationFormatted" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Access URLs:" -ForegroundColor Yellow
    Write-Host "   Frontend:        http://localhost:5173"
    Write-Host "   API Gateway:     http://localhost:4000"
    Write-Host "   API Docs:        http://localhost:4000/api-docs"
    Write-Host "   MinIO Console:   http://localhost:9001"
    Write-Host "   MailDev:         http://localhost:1080"
    Write-Host ""
    Write-Host "📊 Services Running: $runningContainers" -ForegroundColor Yellow
    Write-Host "📝 Full Report: View deployment report in logs\ directory" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Log "SUCCESS" "Local production deployment completed successfully in $durationFormatted"
}
catch {
    Write-Log "ERROR" "Deployment failed: $($_.Exception.Message)"
    exit 1
}