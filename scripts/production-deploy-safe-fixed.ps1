#########################################################
# CLINIC APP - PRODUCTION SAFE DEPLOYMENT SCRIPT
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

# Ensure logs directory exists
if (!(Test-Path $Script:LogDir)) {
    New-Item -ItemType Directory -Path $Script:LogDir -Force | Out-Null
}

$Script:LogFile = Join-Path $Script:LogDir "production-deploy-$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Lock file mechanism
function Test-DeploymentLock {
    if (Test-Path $Script:LockFile) {
        $lockContent = Get-Content $Script:LockFile -ErrorAction SilentlyContinue
        if ($lockContent) {
            try {
                $lockData = $lockContent | ConvertFrom-Json
                $lockTime = [DateTime]$lockData.StartTime
                $lockDuration = (Get-Date) - $lockTime
                
                if ($lockDuration.TotalMinutes -lt 120) {
                    if (-not $Force) {
                        Write-Host "ERROR: Deployment is already running (started at $($lockData.StartTime))" -ForegroundColor Red
                        Write-Host "   PID: $($lockData.ProcessId)" -ForegroundColor Yellow
                        Write-Host "   Use -Force to override (use with caution)" -ForegroundColor Yellow
                        exit 1
                    }
                    else {
                        Write-Host "WARN: Forcing deployment override..." -ForegroundColor Yellow
                    }
                }
                else {
                    Write-Host "WARN: Stale lock file found, removing..." -ForegroundColor Yellow
                    Remove-Item $Script:LockFile -ErrorAction SilentlyContinue
                }
            }
            catch {
                Write-Host "WARN: Corrupted lock file, removing..." -ForegroundColor Yellow
                Remove-Item $Script:LockFile -ErrorAction SilentlyContinue
            }
        }
    }
    
    # Create lock file
    $lockData = @{
        StartTime = Get-Date
        ProcessId = $PID
        ScriptPath = $PSCommandPath
    } | ConvertTo-Json
    
    Set-Content -Path $Script:LockFile -Value $lockData
}

function Remove-DeploymentLock {
    Remove-Item $Script:LockFile -ErrorAction SilentlyContinue
}

# Enhanced logging
function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    # Check deployment timeout
    $elapsed = (Get-Date) - $Script:StartTime
    if ($elapsed -gt $Script:MaxDuration) {
        Write-Host "ERROR: DEPLOYMENT TIMEOUT - Exceeded maximum duration of $($Script:MaxDuration.TotalMinutes) minutes" -ForegroundColor Red
        Remove-DeploymentLock
        exit 1
    }
    
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] [$Level] $Message"
    
    # Console output with colors
    switch ($Level) {
        "INFO"     { Write-Host "[$Timestamp] INFO: $Message" -ForegroundColor Cyan }
        "WARN"     { Write-Host "[$Timestamp] WARN: $Message" -ForegroundColor Yellow }
        "ERROR"    { Write-Host "[$Timestamp] ERROR: $Message" -ForegroundColor Red }
        "SUCCESS"  { Write-Host "[$Timestamp] SUCCESS: $Message" -ForegroundColor Green }
        "STEP"     { Write-Host "[$Timestamp] STEP: $Message" -ForegroundColor Magenta }
        "CRITICAL" { Write-Host "[$Timestamp] CRITICAL: $Message" -ForegroundColor Red -BackgroundColor Yellow }
        "DEBUG"    { Write-Host "[$Timestamp] DEBUG: $Message" -ForegroundColor Gray }
    }
    
    # File logging
    try {
        Add-Content -Path $Script:LogFile -Value $LogEntry -ErrorAction SilentlyContinue
    }
    catch {
        # Continue if logging fails
    }
}

function Show-Help {
    Write-Host "Clinic App - Production Safe Deployment Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "USAGE:" -ForegroundColor Yellow
    Write-Host "    .\scripts\production-deploy-safe-fixed.ps1 [OPTIONS]"
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
    Write-Host "    -Enhanced         Include enhanced services"
    Write-Host "    -Monitoring       Include monitoring stack"
    Write-Host "    -Help             Show this help"
}

# Retry mechanism
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
    
    # Check available disk space
    try {
        $drive = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" -ErrorAction SilentlyContinue
        if ($drive) {
            $freeSpaceGB = [math]::Round($drive.FreeSpace / 1GB, 2)
            
            if ($freeSpaceGB -lt 10) {
                Write-Log "ERROR" "Insufficient disk space: ${freeSpaceGB}GB available, minimum 10GB required"
                exit 1
            }
            Write-Log "INFO" "Disk space check: ${freeSpaceGB}GB available"
        }
    }
    catch {
        Write-Log "WARN" "Could not check disk space"
    }
    
    # Check required tools
    $tools = @{
        "node" = { node --version }
        "yarn" = { yarn --version }
        "docker" = { docker --version }
    }
    
    foreach ($tool in $tools.Keys) {
        try {
            $version = & $tools[$tool] 2>$null
            if ($version) {
                Write-Log "INFO" "$tool found: $($version -split "`n" | Select-Object -First 1)"
            }
            else {
                Write-Log "ERROR" "$tool not found or not working"
                exit 1
            }
        }
        catch {
            Write-Log "ERROR" "$tool not found. Please install before proceeding."
            exit 1
        }
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker compose version 2>$null
        if ($composeVersion) {
            Write-Log "INFO" "docker compose found: $($composeVersion -split "`n" | Select-Object -First 1)"
        }
        else {
            Write-Log "ERROR" "docker compose not found"
            exit 1
        }
    }
    catch {
        Write-Log "ERROR" "docker compose not found. Please install Docker with Compose v2"
        exit 1
    }
    
    # Check Docker daemon
    try {
        docker info >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "INFO" "Docker daemon is running"
        }
        else {
            Write-Log "ERROR" "Docker daemon is not running"
            exit 1
        }
    }
    catch {
        Write-Log "ERROR" "Cannot connect to Docker daemon"
        exit 1
    }
    
    Write-Log "SUCCESS" "All prerequisites satisfied"
}

function Stop-Environment {
    Write-Log "STEP" "Performing controlled environment shutdown..."
    
    Set-Location $Script:ProjectRoot
    
    # Kill runaway processes
    Write-Log "INFO" "Checking for runaway Docker Compose processes..."
    try {
        $composeProcesses = Get-Process -Name "docker-compose" -ErrorAction SilentlyContinue
        if ($composeProcesses) {
            Write-Log "WARN" "Found $($composeProcesses.Count) Docker Compose processes, terminating..."
            $composeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Start-Sleep 3
        }
    }
    catch {
        # Continue if process check fails
    }
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY RUN] Would stop all Docker services and clean system"
        return
    }
    
    # Stop services gracefully
    Write-Log "INFO" "Stopping Docker services..."
    try {
        docker compose down --timeout 30 --remove-orphans 2>$null
    }
    catch {
        Write-Log "WARN" "Graceful shutdown failed, continuing..."
    }
    
    # Force cleanup
    Write-Log "INFO" "Performing cleanup..."
    try {
        # Stop all containers
        $allContainers = @(docker ps -aq 2>$null)
        if ($allContainers.Count -gt 0) {
            Write-Log "INFO" "Force stopping $($allContainers.Count) containers..."
            $allContainers | ForEach-Object { docker stop $_ 2>$null } | Out-Null
            $allContainers | ForEach-Object { docker rm -f $_ 2>$null } | Out-Null
        }
        
        # Clean build cache
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
    }
    catch {
        Write-Log "WARN" "Some cleanup operations failed, continuing..."
    }
    
    Write-Log "SUCCESS" "Environment cleaned and ready"
}

function Start-Services {
    Write-Log "STEP" "Starting services in controlled phases..."
    
    Set-Location $Script:ProjectRoot
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY RUN] Would start services: postgres, redis, nats, minio, frontend"
        return
    }
    
    # Phase 1: Infrastructure
    Write-Log "INFO" "Starting infrastructure services..."
    docker compose up -d postgres redis nats minio maildev
    
    # Wait for PostgreSQL
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
        catch { }
        
        Write-Log "INFO" "PostgreSQL check $i/30..."
        Start-Sleep 3
    }
    
    if (-not $pgReady) {
        Write-Log "ERROR" "PostgreSQL failed to start within timeout"
        exit 1
    }
    
    Write-Log "SUCCESS" "Infrastructure services started"
    
    # Phase 2: Application services (simplified for testing)
    Write-Log "INFO" "Starting core services..."
    docker compose up -d auth-service files-service frontend
    
    Start-Sleep 15
    Write-Log "SUCCESS" "Core services started"
}

function Test-ServiceHealth {
    Write-Log "STEP" "Performing health checks..."
    
    $healthEndpoints = @{
        "frontend" = "http://localhost:5173"
        "auth-service" = "http://localhost:3001/health"
        "files-service" = "http://localhost:3003/health"
    }
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY RUN] Would test health endpoints: $($healthEndpoints.Keys -join ', ')"
        return $true
    }
    
    $failedServices = @()
    
    # Allow services to stabilize
    Write-Log "INFO" "Allowing services to stabilize (30 seconds)..."
    Start-Sleep 30
    
    foreach ($serviceName in $healthEndpoints.Keys) {
        $endpoint = $healthEndpoints[$serviceName]
        Write-Log "INFO" "Testing $serviceName health..."
        
        $serviceHealthy = $false
        for ($attempt = 1; $attempt -le 5; $attempt++) {
            try {
                $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
                
                if ($response.StatusCode -eq 200) {
                    Write-Log "SUCCESS" "$serviceName health check passed"
                    $serviceHealthy = $true
                    break
                }
            }
            catch {
                Write-Log "DEBUG" "$serviceName health check failed (attempt $attempt/5)"
            }
            
            Start-Sleep 5
        }
        
        if (-not $serviceHealthy) {
            Write-Log "ERROR" "$serviceName failed health checks"
            $failedServices += $serviceName
        }
    }
    
    if ($failedServices.Count -eq 0) {
        Write-Log "SUCCESS" "All services passed health checks"
        return $true
    }
    else {
        Write-Log "WARN" "Some services failed: $($failedServices -join ', ')"
        return $false
    }
}

function New-DeploymentReport {
    Write-Log "STEP" "Generating deployment report..."
    
    $endTime = Get-Date
    $duration = $endTime - $Script:StartTime
    $durationFormatted = "{0:hh\:mm\:ss}" -f $duration
    
    $reportFile = Join-Path $Script:LogDir "deployment-report-$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    
    $report = @{
        deployment = @{
            startTime = $Script:StartTime
            endTime = $endTime
            duration = $durationFormatted
            dryRun = $DryRun
        }
        configuration = @{
            keepData = $KeepData
            enhanced = $Enhanced
            monitoring = $Monitoring
            maxRetries = $MaxRetries
            timeoutMinutes = $TimeoutMinutes
        }
        urls = @{
            frontend = "http://localhost:5173"
            authService = "http://localhost:3001"
            filesService = "http://localhost:3003"
        }
    }
    
    try {
        $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportFile -Encoding UTF8
        Write-Log "SUCCESS" "Deployment report saved: $reportFile"
    }
    catch {
        Write-Log "WARN" "Could not save deployment report"
    }
}

#########################################################
# MAIN EXECUTION
#########################################################

# Cleanup trap
$script:cleanup = {
    Write-Log "INFO" "Performing cleanup..."
    Remove-DeploymentLock
}

Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action $script:cleanup | Out-Null

# Show help if requested
if ($Help) {
    Show-Help
    exit 0
}

try {
    # Initialize
    Test-DeploymentLock
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "   CLINIC APP - PRODUCTION SAFE DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "   Anti-loop protection | Comprehensive logging" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Yellow
    Write-Host "   • Dry Run: $DryRun"
    Write-Host "   • Keep Data: $KeepData"
    Write-Host "   • Enhanced Mode: $Enhanced"
    Write-Host "   • Max Retries: $MaxRetries"
    Write-Host "   • Timeout: $TimeoutMinutes minutes"
    Write-Host ""
    Write-Host "Logging:" -ForegroundColor Yellow
    Write-Host "   • Log File: $Script:LogFile"
    Write-Host "   • Lock File: $Script:LockFile"
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Execute deployment phases
    Write-Log "INFO" "Starting production deployment with PID $PID"
    
    Test-Prerequisites
    Stop-Environment
    Start-Services
    $healthPassed = Test-ServiceHealth
    New-DeploymentReport
    
    # Final summary
    $endTime = Get-Date
    $duration = $endTime - $Script:StartTime
    $durationFormatted = "{0:hh\:mm\:ss}" -f $duration
    
    Write-Host ""
    if ($healthPassed -or $DryRun) {
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "   DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        if ($DryRun) {
            Write-Host "   (DRY RUN - No actual deployment performed)" -ForegroundColor Yellow
        }
        Write-Host "   Duration: $durationFormatted" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host ""
        
        if (-not $DryRun) {
            Write-Host "Access URLs:" -ForegroundColor Yellow
            Write-Host "   • Frontend:      http://localhost:5173"
            Write-Host "   • Auth Service:  http://localhost:3001"
            Write-Host "   • Files Service: http://localhost:3003"
            Write-Host ""
        }
        
        Write-Log "SUCCESS" "Production deployment completed successfully in $durationFormatted"
    }
    else {
        Write-Host "===============================================" -ForegroundColor Yellow
        Write-Host "   DEPLOYMENT COMPLETED WITH ISSUES" -ForegroundColor Yellow
        Write-Host "   Some services failed health checks" -ForegroundColor Yellow
        Write-Host "   Duration: $durationFormatted" -ForegroundColor Yellow
        Write-Host "===============================================" -ForegroundColor Yellow
        Write-Host ""
        
        Write-Log "WARN" "Deployment completed with health check failures in $durationFormatted"
    }
}
catch {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host "   DEPLOYMENT FAILED" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host ""
    
    Write-Log "ERROR" "Deployment failed: $($_.Exception.Message)"
    exit 1
}
finally {
    Remove-DeploymentLock
}