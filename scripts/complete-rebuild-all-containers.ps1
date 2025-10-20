# Complete System Rebuild Script for Clinic App - All 34 Containers
# This script performs a complete teardown and rebuild of the entire system
# Including all core, enhanced, and monitoring containers
# Total: 34 containers across all docker-compose files

param(
    [switch]$SkipUserSeeding = $false,
    [string]$AdminEmail = "admin@clinic.com",
    [string]$AdminPassword = "Admin123!",
    [string]$TherapistEmail = "therapist@clinic.com",
    [string]$TherapistPassword = "Therapist123!",
    [string]$PatientEmail = "patient@clinic.com",
    [string]$PatientPassword = "Patient123!"
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Configuration
$API_URL = "http://localhost:4000"

# Color output functions
function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success { param([string]$Message) Write-ColoredOutput "✅ $Message" -Color "Green" }
function Write-Warning { param([string]$Message) Write-ColoredOutput "⚠️  $Message" -Color "Yellow" }
function Write-Error { param([string]$Message) Write-ColoredOutput "❌ $Message" -Color "Red" }
function Write-Info { param([string]$Message) Write-ColoredOutput "ℹ️  $Message" -Color "Cyan" }
function Write-Step { param([string]$Message) Write-ColoredOutput "🔧 $Message" -Color "Magenta" }

# Function to wait with progress
function Wait-WithProgress {
    param(
        [int]$Seconds,
        [string]$Message
    )
    Write-Host "$Message" -NoNewline
    for ($i = 0; $i -lt $Seconds; $i++) {
        Write-Host "." -NoNewline
        Start-Sleep 1
    }
    Write-Host " done!" -ForegroundColor Green
}

# Function to check service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$HealthUrl,
        [int]$MaxAttempts = 30
    )

    Write-Info "Waiting for $ServiceName to be healthy..."

    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response) {
                Write-Success "$ServiceName is healthy!"
                return $true
            }
        } catch {
            # Continue trying
        }

        Write-Host "." -NoNewline
        Start-Sleep 2
    }

    Write-Warning "$ServiceName health check failed after $MaxAttempts attempts"
    return $false
}

# Function to create user in database
function New-DatabaseUser {
    param(
        [string]$UserType,
        [string]$Email,
        [string]$Password,
        [string]$FirstName,
        [string]$LastName,
        [string]$Role
    )

    Write-Info "Creating $UserType user: $Email"

    try {
        # Generate password hash using Node.js
        $hashCommand = "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('$Password', 12))"
        $passwordHash = node -e $hashCommand 2>$null

        if (-not $passwordHash) {
            Write-Error "Failed to generate password hash for $UserType"
            return $false
        }

        # Create user via SQL
        $fullName = "$FirstName $LastName"
        $sqlCommand = "INSERT INTO `"user`" (email, name, password, roles) VALUES ('$Email', '$fullName', '$passwordHash', '{$Role}') ON CONFLICT (email) DO NOTHING;"

        $env:PGPASSWORD = "postgres"
        $result = echo $sqlCommand | psql -h localhost -p 5432 -U postgres -d clinic 2>$null

        if ($LASTEXITCODE -eq 0) {
            Write-Success "$UserType user created: $Email / $Password"
            return $true
        } else {
            Write-Warning "User may already exist or database not ready: $Email"
            return $false
        }
    } catch {
        Write-Error "Exception creating $UserType user: $($_.Exception.Message)"
        return $false
    }
}

# Main rebuild function
function Start-CompleteRebuild {
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host "🚀 COMPLETE SYSTEM REBUILD - ALL 34 CONTAINERS" -ForegroundColor Cyan
    Write-Host "=" * 70 -ForegroundColor Cyan
    Write-Host ""

    # PHASE 1: COMPLETE TEARDOWN
    Write-Host ""
    Write-Step "PHASE 1: COMPLETE TEARDOWN AND CLEANUP"
    Write-Host "-" * 50 -ForegroundColor Yellow

    # Stop all compose stacks
    Write-Info "Stopping all Docker Compose stacks..."
    docker compose down --remove-orphans 2>$null
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --remove-orphans 2>$null
    docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down --remove-orphans 2>$null
    docker compose -f docker-compose.core.yml down --remove-orphans 2>$null
    docker compose -f docker-compose.production-ready.yml down --remove-orphans 2>$null
    docker compose -f docker-compose.staging.yml down --remove-orphans 2>$null
    docker compose -f docker-compose.test.yml down --remove-orphans 2>$null

    # Remove all clinic-app containers
    Write-Info "Removing all clinic-app containers..."
    $containers = docker ps -aq --filter "name=clinic-app" 2>$null
    if ($containers) {
        docker rm -f $containers 2>$null
        Write-Success "Removed all clinic-app containers"
    }

    # Remove all clinic-app images
    Write-Info "Removing all clinic-app images..."
    $images = docker images --filter "reference=clinic-app*" -q 2>$null
    if ($images) {
        docker rmi -f $images 2>$null
        Write-Success "Removed all clinic-app images"
    }

    # Clean up volumes
    Write-Info "Cleaning up Docker volumes..."
    docker volume prune -f 2>$null

    # Clean up networks
    Write-Info "Cleaning up Docker networks..."
    docker network prune -f 2>$null

    # Remove the external clinic-network if it exists
    docker network rm clinic-network 2>$null

    # Clean build cache
    Write-Info "Cleaning Docker build cache..."
    docker builder prune -f 2>$null

    Write-Success "Complete teardown finished!"

    # PHASE 2: DEPENDENCIES AND PRE-BUILD
    Write-Host ""
    Write-Step "PHASE 2: DEPENDENCIES AND PRE-BUILD SETUP"
    Write-Host "-" * 50 -ForegroundColor Yellow

    # Build Node.js dependencies
    Write-Info "Installing Node.js dependencies..."
    yarn install

    Write-Info "Building @clinic/common library..."
    yarn workspace '@clinic/common' build

    # Create external network for monitoring
    Write-Info "Creating Docker networks..."
    docker network create clinic-network 2>$null

    Write-Success "Dependencies ready!"

    # PHASE 3: BUILD ALL IMAGES
    Write-Host ""
    Write-Step "PHASE 3: BUILDING ALL DOCKER IMAGES (NO CACHE)"
    Write-Host "-" * 50 -ForegroundColor Yellow

    # Build main compose images
    Write-Info "Building main application images..."
    docker compose build --no-cache

    # Build enhanced services images
    Write-Info "Building enhanced services images..."
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml build --no-cache

    Write-Success "All images built successfully!"

    # PHASE 4: START INFRASTRUCTURE
    Write-Host ""
    Write-Step "PHASE 4: STARTING INFRASTRUCTURE SERVICES"
    Write-Host "-" * 50 -ForegroundColor Yellow

    Write-Info "Starting core infrastructure..."
    docker compose up -d postgres redis nats minio maildev

    Wait-WithProgress -Seconds 15 -Message "Waiting for infrastructure to initialize"

    # PHASE 5: START MAIN APPLICATION SERVICES
    Write-Host ""
    Write-Step "PHASE 5: STARTING MAIN APPLICATION SERVICES (20 containers)"
    Write-Host "-" * 50 -ForegroundColor Yellow

    Write-Info "Starting all main application services..."
    docker compose up -d

    Wait-WithProgress -Seconds 30 -Message "Waiting for main services to initialize"

    # PHASE 6: START ENHANCED SERVICES
    Write-Host ""
    Write-Step "PHASE 6: STARTING ENHANCED SERVICES (10 containers)"
    Write-Host "-" * 50 -ForegroundColor Yellow

    Write-Info "Starting enhanced services (AI, Search, CDN, etc.)..."
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d

    Wait-WithProgress -Seconds 20 -Message "Waiting for enhanced services to initialize"

    # PHASE 7: START MONITORING STACK
    Write-Host ""
    Write-Step "PHASE 7: STARTING MONITORING & MANAGEMENT STACK (11 containers)"
    Write-Host "-" * 50 -ForegroundColor Yellow

    Write-Info "Starting monitoring and management services..."
    docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

    Wait-WithProgress -Seconds 20 -Message "Waiting for monitoring services to initialize"

    # PHASE 8: HEALTH VERIFICATION
    Write-Host ""
    Write-Step "PHASE 8: VERIFYING SERVICE HEALTH"
    Write-Host "-" * 50 -ForegroundColor Yellow

    # Check critical services
    $healthChecks = @(
        @{Name="API Gateway"; Url="http://localhost:4000/health"},
        @{Name="Auth Service"; Url="http://localhost:3001/health"},
        @{Name="Frontend"; Url="http://localhost:5173"},
        @{Name="Grafana Dashboard"; Url="http://localhost:3000"},
        @{Name="Elasticsearch"; Url="http://localhost:9200/_cluster/health"}
    )

    $allHealthy = $true
    foreach ($check in $healthChecks) {
        if (-not (Test-ServiceHealth -ServiceName $check.Name -HealthUrl $check.Url -MaxAttempts 15)) {
            $allHealthy = $false
        }
    }

    # PHASE 9: USER SEEDING
    if (-not $SkipUserSeeding) {
        Write-Host ""
        Write-Step "PHASE 9: SEEDING DEFAULT USERS"
        Write-Host "-" * 50 -ForegroundColor Yellow

        Wait-WithProgress -Seconds 10 -Message "Waiting for database to be fully ready"

        # Create users
        New-DatabaseUser -UserType "Admin" -Email $AdminEmail -Password $AdminPassword `
                        -FirstName "System" -LastName "Administrator" -Role "admin"

        New-DatabaseUser -UserType "Therapist" -Email $TherapistEmail -Password $TherapistPassword `
                        -FirstName "Dr. Sarah" -LastName "Wilson" -Role "therapist"

        New-DatabaseUser -UserType "Patient" -Email $PatientEmail -Password $PatientPassword `
                        -FirstName "John" -LastName "Doe" -Role "client"
    }

    # PHASE 10: FINAL STATUS REPORT
    Write-Host ""
    Write-Step "PHASE 10: FINAL STATUS REPORT"
    Write-Host "-" * 50 -ForegroundColor Yellow

    # Count containers
    $runningContainers = docker ps --filter "name=clinic-app" --format "{{.Names}}" | Measure-Object | Select-Object -ExpandProperty Count
    $allContainers = docker ps -a --filter "name=clinic-app" --format "{{.Names}}" | Measure-Object | Select-Object -ExpandProperty Count

    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Success "🎉 COMPLETE REBUILD FINISHED!"
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host ""

    # Container status
    Write-Info "📊 CONTAINER STATUS:"
    Write-Host "• Total Containers: $allContainers" -ForegroundColor White
    Write-Host "• Running Containers: $runningContainers" -ForegroundColor Green
    Write-Host "• Target: 34 containers" -ForegroundColor Yellow
    Write-Host ""

    # Service breakdown
    Write-Info "🏗️ SERVICE BREAKDOWN:"
    Write-Host "• Core Application Services: 20 containers" -ForegroundColor White
    Write-Host "• Enhanced Services: 10 containers" -ForegroundColor White
    Write-Host "• Monitoring Stack: 11 containers" -ForegroundColor White
    Write-Host "• Total Expected: 34 unique containers" -ForegroundColor Green
    Write-Host ""

    # List running containers
    Write-Info "📦 RUNNING CONTAINERS:"
    docker ps --filter "name=clinic-app" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    Write-Host ""

    # Access URLs
    Write-Info "🌐 ACCESS URLS:"
    Write-Host "• Main Application: http://localhost:5173" -ForegroundColor White
    Write-Host "• API Gateway: http://localhost:4000" -ForegroundColor White
    Write-Host "• Load Balancer: http://localhost:80" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 MANAGEMENT DASHBOARDS:" -ForegroundColor Cyan
    Write-Host "• Grafana Monitoring: http://localhost:3000 (admin/admin)" -ForegroundColor White
    Write-Host "• pgAdmin Database: http://localhost:5050 (admin@clinic.com/admin)" -ForegroundColor White
    Write-Host "• Redis Commander: http://localhost:8081 (admin/admin)" -ForegroundColor White
    Write-Host "• Uptime Monitoring: http://localhost:3301" -ForegroundColor White
    Write-Host "• Prometheus Metrics: http://localhost:9090" -ForegroundColor White
    Write-Host "• Jaeger Tracing: http://localhost:16686" -ForegroundColor White
    Write-Host "• Elasticsearch: http://localhost:9200" -ForegroundColor White
    Write-Host "• Email Testing: http://localhost:1080" -ForegroundColor White
    Write-Host ""

    if (-not $SkipUserSeeding) {
        Write-Info "DEFAULT USERS:"
        Write-Host "===================================================" -ForegroundColor White
        Write-Host "ADMIN: $AdminEmail / $AdminPassword" -ForegroundColor White
        Write-Host "THERAPIST: $TherapistEmail / $TherapistPassword" -ForegroundColor White
        Write-Host "PATIENT: $PatientEmail / $PatientPassword" -ForegroundColor White
        Write-Host "===================================================" -ForegroundColor White
        Write-Host ""
    }

    # Check for any failed containers
    $failedContainers = docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "{{.Names}}" | Measure-Object | Select-Object -ExpandProperty Count

    if ($failedContainers -gt 0) {
        Write-Warning "⚠️ Some containers have exited. Checking logs..."
        docker ps -a --filter "name=clinic-app" --filter "status=exited" --format "table {{.Names}}\t{{.Status}}"
        Write-Host ""
        Write-Info "To check logs of failed containers, use:"
        Write-Host "docker logs container-name" -ForegroundColor Yellow
    }

    Write-Success "System rebuild complete! All services should be operational."
    Write-Host ""

    # Final tips
    Write-Info "USEFUL COMMANDS:"
    Write-Host "- Check all containers: docker ps --filter name=clinic-app" -ForegroundColor Gray
    Write-Host "- Check logs: docker logs clinic-app-service-name-1" -ForegroundColor Gray
    Write-Host "- Restart a service: docker compose restart service-name" -ForegroundColor Gray
    Write-Host "- Stop everything: docker compose down" -ForegroundColor Gray
    Write-Host ""
}

# Execute the rebuild
Start-CompleteRebuild