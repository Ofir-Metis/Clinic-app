# 🛡️ Production Safe Deployment Guide

## 🎯 Overview

The new **Production Safe Deployment Scripts** solve the **4-hour runaway loop problem** with comprehensive safeguards, controlled deployment phases, and detailed logging.

### Key Features

- ✅ **Anti-Loop Protection**: Automatic timeout and circuit breakers
- ✅ **Deployment Locking**: Prevents concurrent deployments
- ✅ **Comprehensive Logging**: Every action logged with timestamps
- ✅ **Dry Run Mode**: Test deployments without making changes
- ✅ **Controlled Phases**: Services start in dependency order
- ✅ **Health Verification**: Automated service health checks
- ✅ **Force Override**: Handle stuck deployments safely

---

## 🚀 Quick Start

### Windows (PowerShell - Recommended)
```powershell
# Test what would happen (safe)
.\scripts\production-deploy-safe.ps1 -DryRun

# Full production deployment
.\scripts\production-deploy-safe.ps1

# With enhanced services and monitoring
.\scripts\production-deploy-safe.ps1 -Enhanced -Monitoring
```

### Linux/macOS (Bash)
```bash
# Test what would happen (safe)
./scripts/production-deploy-safe.sh --dry-run

# Full production deployment
./scripts/production-deploy-safe.sh

# With enhanced services and monitoring
./scripts/production-deploy-safe.sh --enhanced --monitoring
```

---

## 📋 Command Options

### Safety Options
| Option | PowerShell | Bash | Description |
|--------|------------|------|-------------|
| Dry Run | `-DryRun` | `--dry-run` | Show what would be done without executing |
| Force Override | `-Force` | `--force` | Override deployment locks (use carefully) |
| Max Retries | `-MaxRetries N` | `--max-retries N` | Maximum retries per operation (default: 3) |
| Timeout | `-TimeoutMinutes N` | `--timeout N` | Maximum deployment time in minutes (default: 30) |

### Deployment Options
| Option | PowerShell | Bash | Description |
|--------|------------|------|-------------|
| Keep Data | `-KeepData` | `--keep-data` | Preserve existing database data |
| Enhanced Mode | `-Enhanced` | `--enhanced` | Include AI, Search, CDN services |
| Monitoring | `-Monitoring` | `--monitoring` | Include Prometheus, Grafana stack |
| Skip Tests | `-SkipTests` | `--skip-tests` | Skip E2E testing phase |
| Verbose | N/A | `--verbose` | Enable debug logging |

---

## 🛡️ Anti-Loop Safeguards

### 1. **Deployment Locking**
- Creates `logs/deployment.lock` to prevent concurrent runs
- Automatically removes stale locks (2+ hours old)
- Use `-Force` / `--force` to override if needed

### 2. **Timeout Protection**
- **Default**: 30-minute maximum deployment time
- **Customizable**: Use `-TimeoutMinutes` / `--timeout`
- **Auto-abort**: Kills deployment if timeout exceeded

### 3. **Circuit Breaker Pattern**
- **Automatic retries**: Up to 3 attempts per operation
- **Exponential backoff**: Increasing delays between retries
- **Fail-fast**: Stop immediately on critical failures

### 4. **Process Monitoring**
- **Runaway detection**: Kills stuck Docker Compose processes
- **Resource monitoring**: Checks disk space and memory
- **Health verification**: Confirms services are responding

---

## 📝 Logging & Monitoring

### Log Files Location
```
logs/
├── production-deploy-YYYYMMDD_HHMMSS.log    # Detailed deployment log
├── deployment-report-YYYYMMDD_HHMMSS.json   # Structured deployment report
└── deployment.lock                          # Active deployment lock
```

### Log Levels
- 🔍 **DEBUG**: Detailed technical information
- ℹ️ **INFO**: General information and progress
- ⚠️ **WARN**: Warnings that don't stop deployment
- ❌ **ERROR**: Errors that may cause failure
- ✅ **SUCCESS**: Successful completion of operations
- 🚀 **STEP**: Major deployment phases
- 💥 **CRITICAL**: Critical failures requiring immediate attention

---

## 🏗️ Deployment Phases

### Phase 1: Prerequisites
- Check Node.js, Yarn, Docker versions
- Verify disk space (minimum 10GB)
- Test Docker daemon connectivity
- Validate system resources

### Phase 2: Environment Cleanup
- Kill runaway Docker processes
- Stop existing containers gracefully
- Clean Docker images and cache
- Remove networks and volumes (optional)

### Phase 3: Service Building
- Build services in dependency groups:
  1. **Foundation**: Infrastructure images
  2. **Core Services**: auth, files, settings
  3. **Business Services**: appointments, notes, notifications
  4. **Extended Services**: billing, therapists, integrations
  5. **Gateway**: API gateway
  6. **Frontend**: React app and nginx

### Phase 4: Service Startup
- Start in controlled dependency order
- Wait for PostgreSQL readiness
- Gradual service activation with delays
- Monitor startup progress

### Phase 5: Health Verification
- Test all service health endpoints
- Verify frontend accessibility
- Generate comprehensive report
- Confirm deployment success

---

## 🚨 Emergency Procedures

### If Deployment Hangs
1. **Check lock file**: `cat logs/deployment.lock`
2. **View live logs**: `tail -f logs/production-deploy-*.log`
3. **Force override**: Add `-Force` / `--force` flag
4. **Manual cleanup**: 
   ```bash
   docker compose down --timeout 30
   docker system prune -af
   rm logs/deployment.lock
   ```

### If Services Fail Health Checks
1. **Check service logs**: `docker compose logs service-name`
2. **Verify container status**: `docker compose ps`
3. **Check resource usage**: `docker stats`
4. **Restart specific service**: `docker compose restart service-name`

### If Build Takes Too Long
1. **Increase timeout**: `-TimeoutMinutes 60`
2. **Clear build cache**: `docker builder prune -af`
3. **Use existing images**: Skip rebuild with custom compose file

---

## 📊 Expected Performance

### Deployment Times
- **Clean deployment**: 10-15 minutes
- **With build cache**: 5-8 minutes
- **Dry run**: 1-2 minutes
- **Enhanced mode**: 15-20 minutes

### Resource Requirements
- **Disk Space**: 10GB minimum, 20GB recommended
- **Memory**: 8GB minimum, 16GB recommended
- **CPU**: 4 cores minimum, 8 cores recommended

---

## 🔧 Troubleshooting

### Common Issues

**Issue**: "Deployment is already running"
- **Solution**: Wait for completion or use `-Force` / `--force`
- **Prevention**: Check for stale processes before starting

**Issue**: "PostgreSQL failed to start"
- **Solution**: Check Docker resources and port 5432 availability
- **Prevention**: Ensure no other PostgreSQL instances running

**Issue**: "Service health checks failed"
- **Solution**: Check service logs and increase timeout
- **Prevention**: Verify system resources before deployment

**Issue**: "Build cache full (20GB+)"
- **Solution**: Run `docker builder prune -af`
- **Prevention**: Regular cleanup or use `--keep-data`

### Debug Mode
```powershell
# PowerShell
.\scripts\production-deploy-safe.ps1 -DryRun -Verbose

# Bash
./scripts/production-deploy-safe.sh --dry-run --verbose
```

---

## 🎯 Best Practices

### Before Deployment
1. **Always test with dry run first**
2. **Ensure adequate system resources**
3. **Close unnecessary applications**
4. **Check network connectivity**

### During Deployment
1. **Monitor log output for errors**
2. **Don't interrupt unless critical**
3. **Keep terminal window open**
4. **Note any warning messages**

### After Deployment
1. **Verify all services are healthy**
2. **Test key application features**
3. **Review deployment report**
4. **Keep logs for troubleshooting**

---

## 🆚 Comparison with Old Script

| Feature | Old Script | New Safe Script |
|---------|------------|-----------------|
| **Loop Protection** | ❌ None | ✅ Multiple safeguards |
| **Logging** | ❌ Basic | ✅ Comprehensive with timestamps |
| **Health Checks** | ❌ Simple | ✅ Robust with retries |
| **Timeout** | ❌ None | ✅ 30-minute default |
| **Dry Run** | ❌ Not supported | ✅ Full simulation |
| **Concurrent Prevention** | ❌ None | ✅ Lock file mechanism |
| **Error Recovery** | ❌ Manual | ✅ Automatic retries |
| **Reporting** | ❌ Basic | ✅ JSON structured report |

---

## 🔗 Access URLs (After Deployment)

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:4000  
- **API Documentation**: http://localhost:4000/api-docs
- **MinIO Console**: http://localhost:9001
- **MailDev**: http://localhost:1080
- **Monitoring** (if enabled): http://localhost:3000

---

## 📞 Support

If you encounter issues:

1. **Check log files** in `logs/` directory
2. **Run with dry run** to identify problems
3. **Review this documentation**
4. **Check Docker system status**: `docker system df`

**The new safe deployment scripts solve the runaway loop problem and provide production-grade deployment control with comprehensive safety features.**