#!/bin/bash

################################################################################
# Backup Script Test Utility
#
# Validates the backup script configuration and dependencies
# without performing an actual backup.
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[✓]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $*"
}

log_error() {
    echo -e "${RED}[✗]${NC} $*"
}

echo "========================================="
echo "Backup Script Configuration Test"
echo "========================================="
echo

# Test 1: Check if backup script exists and is executable
echo "Test 1: Backup script validation"
if [ -f "$BACKUP_SCRIPT" ]; then
    log_info "Backup script found at: $BACKUP_SCRIPT"
else
    log_error "Backup script not found at: $BACKUP_SCRIPT"
    exit 1
fi

if [ -x "$BACKUP_SCRIPT" ]; then
    log_info "Backup script is executable"
else
    log_error "Backup script is not executable"
    echo "      Run: chmod +x $BACKUP_SCRIPT"
    exit 1
fi

# Test 2: Check script syntax
echo
echo "Test 2: Script syntax validation"
if bash -n "$BACKUP_SCRIPT"; then
    log_info "Script syntax is valid"
else
    log_error "Script has syntax errors"
    exit 1
fi

# Test 3: Check required dependencies
echo
echo "Test 3: Required dependencies"

if command -v pg_dump &> /dev/null; then
    PG_VERSION=$(pg_dump --version | head -n1)
    log_info "pg_dump found: $PG_VERSION"
else
    log_error "pg_dump not found"
    echo "      Install: sudo apt-get install postgresql-client"
    exit 1
fi

if command -v gzip &> /dev/null; then
    GZIP_VERSION=$(gzip --version | head -n1)
    log_info "gzip found: $GZIP_VERSION"
else
    log_error "gzip not found"
    exit 1
fi

# Test 4: Check optional dependencies
echo
echo "Test 4: Optional dependencies"

if command -v mc &> /dev/null; then
    MC_VERSION=$(mc --version | head -n1)
    log_info "MinIO client (mc) found: $MC_VERSION"
else
    log_warn "MinIO client (mc) not found - MinIO backups will be skipped"
    echo "      Install from: https://min.io/docs/minio/linux/reference/minio-mc.html"
fi

# Test 5: Check environment configuration
echo
echo "Test 5: Environment configuration"

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-clinic}"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"

echo "   PostgreSQL Host: $POSTGRES_HOST"
echo "   PostgreSQL Port: $POSTGRES_PORT"
echo "   PostgreSQL User: $POSTGRES_USER"
echo "   PostgreSQL DB:   $POSTGRES_DB"
echo "   Backup Dir:      $BACKUP_DIR"

# Test 6: Check PostgreSQL connectivity
echo
echo "Test 6: PostgreSQL connectivity"

export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"

if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" &> /dev/null; then
    log_info "PostgreSQL connection successful"

    # Get database size
    DB_SIZE=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" 2>/dev/null | xargs)
    if [ -n "$DB_SIZE" ]; then
        echo "   Database size: $DB_SIZE"
    fi
else
    log_error "Cannot connect to PostgreSQL"
    echo "      Check connection settings and ensure PostgreSQL is running"
    echo "      Test manually: PGPASSWORD=postgres psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -c '\l'"
    exit 1
fi

unset PGPASSWORD

# Test 7: Check backup directory permissions
echo
echo "Test 7: Backup directory permissions"

BACKUP_DIR_TEST="${BACKUP_DIR}/daily"

if [ -d "$BACKUP_DIR" ]; then
    log_info "Backup directory exists: $BACKUP_DIR"

    if [ -w "$BACKUP_DIR" ]; then
        log_info "Backup directory is writable"
    else
        log_error "Backup directory is not writable"
        echo "      Run: sudo chown -R \$USER:\$USER $BACKUP_DIR"
        exit 1
    fi
else
    log_warn "Backup directory does not exist: $BACKUP_DIR"
    echo "      Creating directory..."

    if mkdir -p "$BACKUP_DIR_TEST" 2>/dev/null; then
        log_info "Successfully created backup directory"
    else
        log_error "Cannot create backup directory (permission denied)"
        echo "      Try using a user directory: BACKUP_DIR=\$HOME/backups"
        exit 1
    fi
fi

# Test 8: Estimate backup size requirements
echo
echo "Test 8: Disk space check"

BACKUP_PARTITION=$(df "$BACKUP_DIR" 2>/dev/null | tail -1 | awk '{print $6}' || echo "/")
AVAILABLE_SPACE=$(df -h "$BACKUP_DIR" 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")

echo "   Backup location: $BACKUP_PARTITION"
echo "   Available space: $AVAILABLE_SPACE"

if command -v psql &> /dev/null && [ -n "${POSTGRES_PASSWORD:-}" ]; then
    export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
    DB_SIZE_BYTES=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_database_size('$POSTGRES_DB');" 2>/dev/null | xargs || echo "0")
    unset PGPASSWORD

    if [ "$DB_SIZE_BYTES" -gt 0 ]; then
        # Estimate compressed backup size (typically 20-30% of original)
        ESTIMATED_COMPRESSED=$((DB_SIZE_BYTES * 3 / 10))
        ESTIMATED_COMPRESSED_MB=$((ESTIMATED_COMPRESSED / 1024 / 1024))

        # Account for retention (7 daily + 4 weekly + 3 monthly = 14 backups max)
        ESTIMATED_TOTAL=$((ESTIMATED_COMPRESSED * 14))
        ESTIMATED_TOTAL_GB=$((ESTIMATED_TOTAL / 1024 / 1024 / 1024))

        echo "   Estimated backup size: ~${ESTIMATED_COMPRESSED_MB}MB (compressed)"
        echo "   Estimated total (14 backups): ~${ESTIMATED_TOTAL_GB}GB"
    fi
fi

# Summary
echo
echo "========================================="
echo "Test Summary"
echo "========================================="
log_info "All critical tests passed"
echo
echo "You can now run the backup script:"
echo "  ./scripts/backup.sh"
echo
echo "Or schedule it with cron:"
echo "  0 2 * * * cd $(dirname "$SCRIPT_DIR") && ./scripts/backup.sh >> /var/log/clinic-backup.log 2>&1"
echo
echo "For more options, see: scripts/backup.README.md"
echo "========================================="

exit 0
