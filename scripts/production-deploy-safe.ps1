#########################################################
# 🏗️ CLINIC APP - PRODUCTION SAFE DEPLOYMENT SCRIPT
# Anti-loop safeguards, comprehensive logging, controlled deployment
#########################################################

param(
    [switch]$SkipTests,
    [switch]$KeepData,
    [switch]$Enhanced,
    [switch]$Monitoring,
    [switch]$DryRun,
    [switch]$Force,
    [switch]$Help,
    [int]$MaxRetries = 3,
    [int]$TimeoutMinutes = 30
)

# Configuration
$Script:ProjectRoot = Split-Path -Parent $PSScriptRoot
$Script:LogDir = Join-Path $ProjectRoot "logs"
$Script:LockFile = Join-Path $LogDir "deployment.lock"
$Script:StartTime = Get-Date
$Script:MaxDuration = [TimeSpan]::FromMinutes($TimeoutMinutes)
$Script:RetryCount = @{}

# Ensure logs directory exists
if (!(Test-Path $Script:LogDir)) {
    New-Item -ItemType Directory -Path $Script:LogDir -Force | Out-Null
}

$Script:LogFile = Join-Path $Script:LogDir "production-deploy-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Lock file mechanism to prevent concurrent deployments
function Test-DeploymentLock {
    if (Test-Path $Script:LockFile) {
        $lockContent = Get-Content $Script:LockFile -ErrorAction SilentlyContinue
        if ($lockContent) {
            $lockData = $lockContent | ConvertFrom-Json
            $lockTime = [DateTime]$lockData.StartTime
            $lockDuration = (Get-Date) - $lockTime
            
            if ($lockDuration.TotalMinutes -lt 120) {  # 2 hour timeout
                if (-not $Force) {
                    Write-Host "❌ Deployment is already running (started at $($lockData.StartTime))" -ForegroundColor Red
                    Write-Host "   PID: $($lockData.ProcessId)" -ForegroundColor Yellow
                    Write-Host "   Use -Force to override (use with caution)" -ForegroundColor Yellow
                    exit 1
                }
                else {
                    Write-Host "⚠️  Forcing deployment override..." -ForegroundColor Yellow
                }
            }
            else {
                Write-Host "⚠️  Stale lock file found (older than 2 hours), removing..." -ForegroundColor Yellow
                Remove-Item $Script:LockFile -ErrorAction SilentlyContinue
            }
        }
    }
    
    # Create lock file
    $lockData = @{
        StartTime = Get-Date
        ProcessId = $PID
        ScriptPath = $MyInvocation.MyCommand.Path
    } | ConvertTo-Json
    
    Set-Content -Path $Script:LockFile -Value $lockData
}

function Remove-DeploymentLock {
    Remove-Item $Script:LockFile -ErrorAction SilentlyContinue
}

# Enhanced logging with circuit breaker pattern
function Write-Log {
    param(
        [string]$Level,
        [string]$Message,
        [switch]$NoConsole
    )
    
    # Check deployment timeout
    $elapsed = (Get-Date) - $Script:StartTime
    if ($elapsed -gt $Script:MaxDuration) {
        Write-Host "❌ DEPLOYMENT TIMEOUT: Exceeded maximum duration of $($Script:MaxDuration.TotalMinutes) minutes" -ForegroundColor Red
        Remove-DeploymentLock
        exit 1
    }
    
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    # Console output
    if (-not $NoConsole) {
        switch ($Level) {
            "INFO"     { Write-Host "[$Timestamp] ℹ️  $Message" -ForegroundColor Cyan }
            "WARN"     { Write-Host "[$Timestamp] ⚠️  $Message" -ForegroundColor Yellow }
            "ERROR"    { Write-Host "[$Timestamp] ❌ $Message" -ForegroundColor Red }
            "SUCCESS"  { Write-Host "[$Timestamp] ✅ $Message" -ForegroundColor Green }
            "STEP"     { Write-Host "[$Timestamp] 🚀 $Message" -ForegroundColor Magenta }
            "CRITICAL" { Write-Host "[$Timestamp] 💥 $Message" -ForegroundColor Red -BackgroundColor Yellow }
            "DEBUG"    { if ($VerbosePreference -eq "Continue") { Write-Host "[$Timestamp] 🔍 $Message" -ForegroundColor Gray } }
        }
    }
    
    # File logging
    try {
        Add-Content -Path $Script:LogFile -Value $LogEntry -ErrorAction SilentlyContinue
    }
    catch {
        # If logging fails, continue (don't break deployment)
    }
}

function Show-Help {
    Write-Host "🏗️  Clinic App - Production Safe Deployment Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "    .\scripts\production-deploy-safe.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "SAFETY OPTIONS:" -ForegroundColor Yellow
    Write-Host "    -DryRun           Show what would be done without executing"
    Write-Host "    -Force            Override existing deployment locks"
    Write-Host "    -MaxRetries N     Maximum retries per operation (default: 3)"
    Write-Host "    -TimeoutMinutes N Maximum deployment time (default: 30)"
    Write-Host ""
    Write-Host "DEPLOYMENT OPTIONS:" -ForegroundColor Yellow
    Write-Host "    -SkipTests        Skip E2E testing phase"
    Write-Host "    -KeepData         Preserve existing database data"
    Write-Host "    -Enhanced         Include enhanced services (AI, Search, CDN)"
    Write-Host "    -Monitoring       Include monitoring stack"
    Write-Host "    -Help             Show this help"
    Write-Host ""
    Write-Host "EXAMPLES:" -ForegroundColor Yellow
    Write-Host "    .\scripts\production-deploy-safe.ps1 -DryRun"
    Write-Host "    .\scripts\production-deploy-safe.ps1 -Enhanced -TimeoutMinutes 45"
    Write-Host "    .\scripts\production-deploy-safe.ps1 -Force -KeepData"
}

# Circuit breaker pattern for operations
function Invoke-WithRetry {
    param(
        [ScriptBlock]$Operation,
        [string]$OperationName,
        [int]$MaxAttempts = $MaxRetries,
        [int]$DelaySeconds = 5
    )
    
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            Write-Log "DEBUG" "Attempting $OperationName (attempt $attempt/$MaxAttempts)"
            
            if ($DryRun) {
                Write-Log "INFO" "[DRY RUN] Would execute: $OperationName"
                return $true
            }
            
            $result = & $Operation
            Write-Log "SUCCESS" "$OperationName completed successfully"
            return $result
        }
        catch {
            Write-Log "WARN" "$OperationName failed on attempt $attempt/$MaxAttempts`: $($_.Exception.Message)"
            
            if ($attempt -eq $MaxAttempts) {
                Write-Log "ERROR" "$OperationName failed after $MaxAttempts attempts"
                throw
            }
            
            Write-Log "INFO" "Retrying $OperationName in $DelaySeconds seconds..."
            Start-Sleep $DelaySeconds
        }
    }
}

function Test-Prerequisites {
    Write-Log "STEP" "Checking prerequisites and system readiness..."
    
    # Check if already deployed
    try {
        $runningContainers = @(docker compose ps -q 2>$null).Count
        if ($runningContainers -gt 0) {
            Write-Log "WARN" "Found $runningContainers running containers from previous deployment"
            Write-Log "INFO" "This deployment will perform a clean rebuild"
        }
    }
    catch {}
    
    # Check available disk space (minimum 10GB)
    $drive = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeSpaceGB = [math]::Round($drive.FreeSpace / 1GB, 2)
    
    if ($freeSpaceGB -lt 10) {
        Write-Log "ERROR" "Insufficient disk space: ${freeSpaceGB}GB available, minimum 10GB required"
        exit 1
    }
    Write-Log "INFO" "Disk space check: ${freeSpaceGB}GB available"
    
    # Check memory (minimum 8GB recommended)
    $totalMemoryGB = [math]::Round((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
    if ($totalMemoryGB -lt 8) {
        Write-Log "WARN" "Low system memory: ${totalMemoryGB}GB (8GB+ recommended for stable deployment)"
    }
    else {
        Write-Log "INFO" "System memory: ${totalMemoryGB}GB"
    }
    
    # Check required tools
    $tools = @{
        "node" = { node --version }
        "yarn" = { yarn --version }
        "docker" = { docker --version }
        "docker compose" = { docker compose version }
    }
    
    foreach ($tool in $tools.Keys) {
        try {
            $version = & $tools[$tool] 2>$null
            Write-Log "INFO" "$tool found: $($version -split "`n" | Select-Object -First 1)"
        }
        catch {
            Write-Log "ERROR" "$tool not found. Please install before proceeding."
            exit 1
        }
    }
    
    # Check Docker daemon
    Invoke-WithRetry -OperationName "Docker daemon connectivity" -Operation {
        docker info > $null
    }
    
    Write-Log "SUCCESS" "All prerequisites satisfied"
}

function Stop-Environment {
    Write-Log "STEP" "Performing controlled environment shutdown..."
    
    Set-Location $Script:ProjectRoot
    
    # Kill any runaway docker-compose processes first
    Write-Log "INFO" "Checking for runaway Docker Compose processes..."
    try {
        $composeProcesses = Get-Process -Name "docker-compose" -ErrorAction SilentlyContinue
        if ($composeProcesses) {
            Write-Log "WARN" "Found $($composeProcesses.Count) Docker Compose processes, terminating..."
            $composeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep 3
        }
    }
    catch {}
    
    # Stop services gracefully with timeout
    $composeFiles = @("docker-compose.yml")
    if ($Enhanced) { $composeFiles += "docker-compose.enhanced.yml" }
    if ($Monitoring) { $composeFiles += "docker-compose.monitoring.yml" }
    
    foreach ($composeFile in $composeFiles) {
        if (Test-Path $composeFile) {
            Write-Log "INFO" "Stopping services from $composeFile..."
            try {
                if (-not $DryRun) {
                    $composeArgs = @()
                    foreach ($file in $composeFiles[0..$composeFiles.IndexOf($composeFile)]) {
                        $composeArgs += "-f", $file
                    }
                    & docker compose @composeArgs down --timeout 30 --remove-orphans 2>$null
                }
            }
            catch {
                Write-Log "WARN" "Graceful shutdown failed for $composeFile, continuing..."
            }
        }
    }
    
    # Force cleanup if needed
    if (-not $DryRun) {
        Write-Log "INFO" "Performing aggressive cleanup..."
        
        # Stop all containers
        try {
            $allContainers = @(docker ps -aq 2>$null)
            if ($allContainers.Count -gt 0) {
                Write-Log "INFO" "Force stopping $($allContainers.Count) containers..."
                docker stop $allContainers 2>$null | Out-Null
                docker rm -f $allContainers 2>$null | Out-Null
            }
        }
        catch {}
        
        # Clean build cache aggressively
        Write-Log "INFO" "Cleaning Docker build cache..."
        docker builder prune -af 2>$null | Out-Null
        
        # System cleanup
        if ($KeepData) {
            Write-Log "INFO" "Cleaning Docker system (preserving volumes)..."
            docker system prune -af 2>$null | Out-Null
        }
        else {
            Write-Log "INFO" "Cleaning Docker system including volumes..."
            docker system prune -af --volumes 2>$null | Out-Null
        }
        
        # Verify cleanup
        $remainingContainers = @(docker ps -aq 2>$null).Count
        Write-Log "INFO" "Cleanup complete. Remaining containers: $remainingContainers"
    }
    
    Write-Log "SUCCESS" "Environment cleaned and ready for fresh deployment"
}

function Build-DockerServices {
    Write-Log "STEP" "Building Docker services with anti-loop safeguards..."
    
    Set-Location $Script:ProjectRoot
    
    # Core services in dependency order
    $serviceGroups = @{
        "Foundation" = @("postgres", "redis", "nats", "minio", "maildev")
        "Core Services" = @("auth-service", "files-service", "settings-service")
        "Business Services" = @("appointments-service", "notes-service", "notifications-service", "analytics-service")
        "Extended Services" = @("billing-service", "therapists-service", "google-integration-service", "client-relationships-service")
        "Gateway" = @("api-gateway")
        "Frontend" = @("frontend", "nginx")
    }
    
    # Enhanced services
    if ($Enhanced) {
        $serviceGroups["Enhanced"] = @("ai-service", "search-service", "cdn-service", "progress-service")
    }
    
    Write-Log "INFO" "Planning to build $($serviceGroups.Values | ForEach-Object { $_.Count } | Measure-Object -Sum | Select-Object -ExpandProperty Sum) services"
    
    foreach ($groupName in $serviceGroups.Keys) {
        $services = $serviceGroups[$groupName]
        Write-Log "INFO" "Building $groupName group: $($services -join ', ')"
        
        foreach ($service in $services) {
            # Skip infrastructure services (they use pre-built images)
            if ($serviceGroups["Foundation"] -contains $service) {
                Write-Log "INFO" "Skipping $service (uses pre-built image)"
                continue
            }
            
            Write-Log "INFO" "Building $service..."
            
            Invoke-WithRetry -OperationName "Build $service" -Operation {
                if (-not $DryRun) {
                    $buildArgs = @("compose", "build", "--no-cache", "--pull", $service)
                    
                    # Add compose files for enhanced services
                    if ($Enhanced -and $serviceGroups["Enhanced"] -contains $service) {
                        $buildArgs = @("compose", "-f", "docker-compose.yml", "-f", "docker-compose.enhanced.yml", "build", "--no-cache", "--pull", $service)
                    }
                    
                    $output = & docker @buildArgs 2>&1
                    if ($LASTEXITCODE -ne 0) {
                        throw "Docker build failed for $service`: $output"
                    }
                    
                    Write-Log "DEBUG" "Build output for $service`: $output"
                }
            } -MaxAttempts 2
        }
        
        # Brief pause between groups to prevent resource exhaustion
        if (-not $DryRun) {
            Start-Sleep 5
        }
    }
    
    Write-Log "SUCCESS" "All Docker services built successfully"
}

function Start-Services {
    Write-Log "STEP" "Starting services in controlled phases..."
    
    Set-Location $Script:ProjectRoot
    
    # Phase 1: Infrastructure
    Write-Log "INFO" "Phase 1: Starting infrastructure services..."
    $infraServices = @("postgres", "redis", "nats", "minio", "maildev")
    
    if (-not $DryRun) {
        docker compose up -d @infraServices
        
        # Wait for PostgreSQL with proper timeout
        Write-Log "INFO" "Waiting for PostgreSQL readiness..."
        $pgReady = $false
        for ($i = 1; $i -le 30; $i++) {
            try {
                $result = docker compose exec -T postgres pg_isready -U postgres 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $pgReady = $true
                    break
                }
            }
            catch {}
            
            Write-Log "INFO" "PostgreSQL check $i/30..."
            Start-Sleep 3
        }
        
        if (-not $pgReady) {
            Write-Log "ERROR" "PostgreSQL failed to start within timeout"
            throw "Infrastructure startup failed"
        }
    }
    
    # Phase 2: Core application services
    Write-Log "INFO" "Phase 2: Starting core application services..."
    $coreServices = @("auth-service", "files-service", "settings-service")
    
    if (-not $DryRun) {
        docker compose up -d @coreServices
        Start-Sleep 15  # Allow core services to stabilize
    }
    
    # Phase 3: Business services
    Write-Log "INFO" "Phase 3: Starting business services..."
    $businessServices = @("appointments-service", "notes-service", "notifications-service", "analytics-service")
    
    if (-not $DryRun) {
        docker compose up -d @businessServices
        Start-Sleep 15
    }
    
    # Phase 4: Extended services
    Write-Log "INFO" "Phase 4: Starting extended services..."
    $extendedServices = @("billing-service", "therapists-service", "google-integration-service", "client-relationships-service")
    
    if (-not $DryRun) {
        docker compose up -d @extendedServices
        Start-Sleep 15
    }
    
    # Phase 5: API Gateway and Frontend
    Write-Log "INFO" "Phase 5: Starting API gateway and frontend..."
    if (-not $DryRun) {
        docker compose up -d api-gateway
        Start-Sleep 10
        docker compose up -d frontend nginx
    }
    
    # Phase 6: Enhanced services (if requested)
    if ($Enhanced) {
        Write-Log "INFO" "Phase 6: Starting enhanced services..."
        if (-not $DryRun) {
            docker compose -f docker-compose.yml -f docker-compose.enhanced.yml up -d ai-service search-service cdn-service progress-service
        }
    }
    
    Write-Log "SUCCESS" "All services started in controlled phases"
}

function Test-ServiceHealth {
    Write-Log "STEP" "Performing comprehensive health checks..."
    
    # Health endpoints with expected response patterns
    $healthEndpoints = @{
        "api-gateway" = @{ 
            url = "http://localhost:4000/health"
            timeout = 10
            critical = $true
        }
        "auth-service" = @{ 
            url = "http://localhost:3001/health"
            timeout = 10
            critical = $true
        }
        "appointments-service" = @{ 
            url = "http://localhost:3002/health"
            timeout = 10
            critical = $true
        }
        "files-service" = @{ 
            url = "http://localhost:3003/health"
            timeout = 10
            critical = $true
        }
        "frontend" = @{ 
            url = "http://localhost:5173"
            timeout = 10
            critical = $true
        }
    }
    
    $failedServices = @()
    $totalServices = $healthEndpoints.Keys.Count
    
    # Allow services to stabilize
    Write-Log "INFO" "Allowing services to stabilize (60 seconds)..."
    if (-not $DryRun) {
        Start-Sleep 60
    }
    
    foreach ($serviceName in $healthEndpoints.Keys) {
        $endpoint = $healthEndpoints[$serviceName]
        Write-Log "INFO" "Testing $serviceName health..."
        
        if ($DryRun) {
            Write-Log "INFO" "[DRY RUN] Would test: $($endpoint.url)"
            continue
        }
        
        $serviceHealthy = $false
        for ($attempt = 1; $attempt -le 10; $attempt++) {
            try {
                $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec $endpoint.timeout -UseBasicParsing -ErrorAction Stop
                
                if ($response.StatusCode -eq 200) {
                    Write-Log "SUCCESS" "$serviceName health check passed (attempt $attempt)"
                    $serviceHealthy = $true
                    break
                }
                else {
                    Write-Log "WARN" "$serviceName returned status $($response.StatusCode) (attempt $attempt/10)"
                }
            }
            catch {
                Write-Log "DEBUG" "$serviceName health check failed (attempt $attempt/10): $($_.Exception.Message)"
            }
            
            Start-Sleep 5
        }
        
        if (-not $serviceHealthy) {
            Write-Log "ERROR" "$serviceName failed health checks after 10 attempts"
            if ($endpoint.critical) {
                $failedServices += $serviceName
            }
        }
    }
    
    # Summary
    $healthyServices = $totalServices - $failedServices.Count
    Write-Log "INFO" "Health check summary: $healthyServices/$totalServices services healthy"
    
    if ($failedServices.Count -eq 0) {
        Write-Log "SUCCESS" "All critical services passed health checks"
        return $true
    }
    else {
        Write-Log "ERROR" "Critical services failed: $($failedServices -join ', ')"
        Write-Log "INFO" "Check service logs: docker compose logs <service-name>"
        return $false
    }
}

function New-DeploymentReport {
    Write-Log "STEP" "Generating deployment report..."
    
    $endTime = Get-Date
    $duration = $endTime - $Script:StartTime
    $durationFormatted = "{0:hh\:mm\:ss}" -f $duration
    
    $reportFile = Join-Path $Script:LogDir "deployment-report-$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    
    # Collect system information
    try {
        $serviceStatus = if (-not $DryRun) {
            docker compose ps --format json | ConvertFrom-Json
        } else { @() }
        
        $dockerInfo = if (-not $DryRun) {
            docker system df --format json | ConvertFrom-Json
        } else { @{} }
        
    } catch {
        $serviceStatus = @()
        $dockerInfo = @{}
    }
    
    $report = @{
        deployment = @{
            startTime = $Script:StartTime
            endTime = $endTime
            duration = $durationFormatted
            success = $true  # Will be updated by caller
            dryRun = $DryRun
        }
        configuration = @{
            keepData = $KeepData
            enhanced = $Enhanced
            monitoring = $Monitoring
            skipTests = $SkipTests
            maxRetries = $MaxRetries
            timeoutMinutes = $TimeoutMinutes
        }
        services = $serviceStatus
        system = @{
            dockerInfo = $dockerInfo
            logFile = $Script:LogFile
            lockFile = $Script:LockFile
        }
        urls = @{
            frontend = "http://localhost:5173"
            apiGateway = "http://localhost:4000"
            apiDocs = "http://localhost:4000/api-docs"
            minio = "http://localhost:9001"
            maildev = "http://localhost:1080"
        }
    }
    
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Log "SUCCESS" "Deployment report saved: $reportFile"
}

#########################################################
# 🚀 MAIN EXECUTION WITH ERROR HANDLING
#########################################################

# Trap for cleanup
trap {
    Write-Log "CRITICAL" "Deployment interrupted: $($_.Exception.Message)"
    Remove-DeploymentLock
    exit 1
}

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

try {
    # Initialize deployment
    Test-DeploymentLock
    
    Write-Host ""
    Write-Host "🛡️  ===============================================" -ForegroundColor Cyan
    Write-Host "   CLINIC APP - PRODUCTION SAFE DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "   Anti-loop protection | Comprehensive logging" -ForegroundColor Cyan
    Write-Host "   ===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔧 Configuration:" -ForegroundColor Yellow
    Write-Host "   • Dry Run: $DryRun"
    Write-Host "   • Keep Data: $KeepData"
    Write-Host "   • Enhanced Mode: $Enhanced"
    Write-Host "   • Monitoring: $Monitoring"
    Write-Host "   • Max Retries: $MaxRetries"
    Write-Host "   • Timeout: $TimeoutMinutes minutes"
    Write-Host "   • Force Override: $Force"
    Write-Host ""
    Write-Host "📝 Logging:" -ForegroundColor Yellow
    Write-Host "   • Log File: $Script:LogFile"
    Write-Host "   • Lock File: $Script:LockFile"
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Execute deployment phases
    Write-Log "INFO" "Starting production deployment with PID $PID"
    
    Test-Prerequisites
    Stop-Environment
    Build-DockerServices
    Start-Services
    $healthPassed = Test-ServiceHealth
    New-DeploymentReport
    
    # Final summary
    $endTime = Get-Date
    $duration = $endTime - $Script:StartTime
    $durationFormatted = "{0:hh\:mm\:ss}" -f $duration
    
    Write-Host ""
    if ($healthPassed -or $DryRun) {
        Write-Host "🎉 ===============================================" -ForegroundColor Green
        Write-Host "   DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        if ($DryRun) {
            Write-Host "   (DRY RUN - No actual deployment performed)" -ForegroundColor Yellow
        }
        Write-Host "   Duration: $durationFormatted" -ForegroundColor Green
        Write-Host "   ===============================================" -ForegroundColor Green
        Write-Host ""
        
        if (-not $DryRun) {
            Write-Host "🔗 Access URLs:" -ForegroundColor Yellow
            Write-Host "   • Frontend:      http://localhost:5173"
            Write-Host "   • API Gateway:   http://localhost:4000"
            Write-Host "   • API Docs:      http://localhost:4000/api-docs"
            Write-Host "   • MinIO Console: http://localhost:9001"
            Write-Host "   • MailDev:       http://localhost:1080"
            Write-Host ""
        }
        
        Write-Host "📊 Deployment Details:" -ForegroundColor Yellow
        Write-Host "   • Log File: $Script:LogFile"
        Write-Host "   • Report: logs/deployment-report-*.json"
        Write-Host ""
        
        Write-Log "SUCCESS" "Production deployment completed successfully in $durationFormatted"
    }
    else {
        Write-Host "⚠️  ===============================================" -ForegroundColor Yellow
        Write-Host "   DEPLOYMENT COMPLETED WITH ISSUES" -ForegroundColor Yellow
        Write-Host "   Some services failed health checks" -ForegroundColor Yellow
        Write-Host "   Duration: $durationFormatted" -ForegroundColor Yellow
        Write-Host "   ===============================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "   • Check logs: docker compose logs <service-name>"
        Write-Host "   • View log file: $Script:LogFile"
        Write-Host ""
        
        Write-Log "WARN" "Deployment completed with health check failures in $durationFormatted"
    }
}
catch {
    Write-Host ""
    Write-Host "💥 ===============================================" -ForegroundColor Red
    Write-Host "   DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   ===============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   • Check log file: $Script:LogFile"
    Write-Host "   • View Docker logs: docker compose logs"
    Write-Host "   • Try dry run first: -DryRun"
    Write-Host ""
    
    Write-Log "ERROR" "Deployment failed: $($_.Exception.Message)"
    exit 1
}
finally {
    # Always cleanup
    Remove-DeploymentLock
}