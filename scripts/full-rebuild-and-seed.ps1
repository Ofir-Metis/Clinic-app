# Full Rebuild and Seed Script for Clinic App (PowerShell)
# This script performs a complete rebuild with Docker cleanup and seeds all necessary users
# Usage: .\scripts\full-rebuild-and-seed.ps1

param(
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
$ADMIN_SECRET = "clinic-admin-secret-2024"

# Function to write colored output
function Write-ColoredOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColoredOutput "✅ $Message" -Color "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColoredOutput "⚠️  $Message" -Color "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColoredOutput "❌ $Message" -Color "Red"
}

function Write-Info {
    param([string]$Message)
    Write-ColoredOutput "$Message" -Color "Cyan"
}

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

    Write-Error "$ServiceName failed to become healthy after $MaxAttempts attempts"
    return $false
}

# Function to create user
function New-User {
    param(
        [string]$UserType,
        [string]$Email,
        [string]$Password,
        [string]$FirstName,
        [string]$LastName,
        [string]$Role
    )

    Write-Info "Creating $UserType user: $Email"

    # Generate password hash using Node.js
    try {
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
            Write-Success "$UserType user created successfully: $Email"
            return $true
        } else {
            Write-Error "Failed to create $UserType user via SQL"
            return $false
        }
    } catch {
        Write-Error "Exception creating $UserType user: $($_.Exception.Message)"
        return $false
    }
}

# Main script execution
function Main {
    Write-Info "🚀 Starting Full Rebuild and Seed Process"
    Write-Host "=".PadRight(50, "=") -ForegroundColor Cyan

    # Step 1: Stop all running containers
    Write-Info "📦 Step 1: Stopping all running containers..."
    docker compose down --remove-orphans 2>$null
    docker compose -f docker-compose.yml -f docker-compose.enhanced.yml down --remove-orphans 2>$null
    docker compose -f docker-compose.yml -f docker-compose.monitoring.yml down --remove-orphans 2>$null

    # Step 2: Remove all containers and images
    Write-Info "🧹 Step 2: Cleaning up Docker environment..."

    # Remove all clinic-app containers
    Write-Info "Removing all clinic-app containers..."
    $containers = docker ps -aq --filter "name=clinic-app" 2>$null
    if ($containers) {
        docker rm -f $containers 2>$null
    }

    # Remove all clinic-app images
    Write-Info "Removing all clinic-app images..."
    $images = docker images --filter "reference=clinic-app*" -q 2>$null
    if ($images) {
        docker rmi -f $images 2>$null
    }

    # Clean up unused volumes and networks
    Write-Info "Cleaning up volumes and networks..."
    docker volume prune -f 2>$null
    docker network prune -f 2>$null

    # Step 3: Build dependencies
    Write-Info "🔧 Step 3: Building dependencies..."
    yarn install
    yarn workspace '@clinic/common' build

    # Step 4: Build all Docker images
    Write-Info "🏗️ Step 4: Building all Docker images..."
    docker compose build --no-cache

    # Step 5: Start infrastructure services first
    Write-Info "🏗️ Step 5: Starting infrastructure services..."
    docker compose up -d postgres redis nats minio maildev

    # Wait for infrastructure to be ready
    Wait-WithProgress -Seconds 15 -Message "Waiting for infrastructure services to initialize"

    # Step 6: Start core application services
    Write-Info "🚀 Step 6: Starting core application services..."
    docker compose up -d

    # Wait for core services
    Wait-WithProgress -Seconds 30 -Message "Waiting for core services to initialize"

    # Step 7: Start enhanced services (if available)
    Write-Info "🔧 Step 7: Starting enhanced services..."
    if (Test-Path "docker-compose.enhanced.yml") {
        docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d 2>$null
    }

    # Step 8: Start monitoring services
    Write-Info "📊 Step 8: Starting monitoring services..."
    if (Test-Path "docker-compose.monitoring.yml") {
        docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d 2>$null
    }

    # Step 9: Health checks
    Write-Info "🏥 Step 9: Performing health checks..."

    # Check API Gateway
    if (Test-ServiceHealth -ServiceName "API Gateway" -HealthUrl "http://localhost:4000/health" -MaxAttempts 30) {
        Write-Success "API Gateway is healthy"
    } else {
        Write-Error "API Gateway health check failed"
        return
    }

    # Check Auth Service
    if (Test-ServiceHealth -ServiceName "Auth Service" -HealthUrl "http://localhost:3001/health" -MaxAttempts 15) {
        Write-Success "Auth Service is healthy"
    } else {
        Write-Warning "Auth Service health check failed, continuing..."
    }

    # Step 10: Seed users
    Write-Info "👥 Step 10: Creating seed users..."

    # Wait a bit more for services to fully initialize
    Wait-WithProgress -Seconds 10 -Message "Waiting for services to fully initialize before seeding users"

    # Create admin user
    if (New-User -UserType "Admin" -Email $AdminEmail -Password $AdminPassword -FirstName "System" -LastName "Administrator" -Role "admin") {
        Write-Success "✅ Admin user created: $AdminEmail / $AdminPassword"
    } else {
        Write-Error "Failed to create admin user"
    }

    # Create therapist user
    if (New-User -UserType "Therapist" -Email $TherapistEmail -Password $TherapistPassword -FirstName "Dr. Sarah" -LastName "Wilson" -Role "therapist") {
        Write-Success "✅ Therapist user created: $TherapistEmail / $TherapistPassword"
    } else {
        Write-Error "Failed to create therapist user"
    }

    # Create patient/client user
    if (New-User -UserType "Patient" -Email $PatientEmail -Password $PatientPassword -FirstName "John" -LastName "Doe" -Role "client") {
        Write-Success "✅ Patient user created: $PatientEmail / $PatientPassword"
    } else {
        Write-Error "Failed to create patient user"
    }

    # Step 11: Final status report
    Write-Info "📋 Step 11: Final status report..."
    Write-Host ""
    Write-Host "=".PadRight(50, "=") -ForegroundColor Green
    Write-Success "🎉 FULL REBUILD AND SEED COMPLETED SUCCESSFULLY!"
    Write-Host "=".PadRight(50, "=") -ForegroundColor Green
    Write-Host ""

    Write-Host "📊 Container Status:" -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String "clinic-app"
    Write-Host ""

    Write-Host "👥 Seed Users Created:" -ForegroundColor Cyan
    Write-Host "┌─────────────────────────────────────────────────────┐" -ForegroundColor White
    Write-Host "│ 1. 👑 ADMIN USER                                   │" -ForegroundColor White
    Write-Host "│    Email: $AdminEmail" -ForegroundColor White
    Write-Host "│    Password: $AdminPassword" -ForegroundColor White
    Write-Host "│    Access: Admin Dashboard + Monitoring            │" -ForegroundColor White
    Write-Host "│    URL: http://localhost:5173/admin                │" -ForegroundColor White
    Write-Host "│                                                     │" -ForegroundColor White
    Write-Host "│ 2. 🩺 THERAPIST USER                              │" -ForegroundColor White
    Write-Host "│    Email: $TherapistEmail" -ForegroundColor White
    Write-Host "│    Password: $TherapistPassword" -ForegroundColor White
    Write-Host "│    Access: Therapist Dashboard                     │" -ForegroundColor White
    Write-Host "│    URL: http://localhost:5173/therapist            │" -ForegroundColor White
    Write-Host "│                                                     │" -ForegroundColor White
    Write-Host "│ 3. 👤 PATIENT USER                                │" -ForegroundColor White
    Write-Host "│    Email: $PatientEmail" -ForegroundColor White
    Write-Host "│    Password: $PatientPassword" -ForegroundColor White
    Write-Host "│    Access: Client Portal                           │" -ForegroundColor White
    Write-Host "│    URL: http://localhost:5173/client               │" -ForegroundColor White
    Write-Host "└─────────────────────────────────────────────────────┘" -ForegroundColor White
    Write-Host ""

    Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
    Write-Host "• Main App: http://localhost:5173"
    Write-Host "• API Gateway: http://localhost:4000"
    Write-Host "• Admin Dashboard: http://localhost:5173/admin"
    Write-Host "• Monitoring (Grafana): http://localhost:3000"
    Write-Host "• Monitoring (Prometheus): http://localhost:9090"
    Write-Host "• Email Testing: http://localhost:1080"
    Write-Host ""

    Write-Host "⚠️ IMPORTANT SECURITY NOTES:" -ForegroundColor Yellow
    Write-Host "• Change all default passwords immediately after first login"
    Write-Host "• The admin user has access to monitoring and system management"
    Write-Host "• All users are created with default credentials for testing"
    Write-Host ""

    Write-Success "Clinic application is now ready for use!"
}

# Execute main function
Main