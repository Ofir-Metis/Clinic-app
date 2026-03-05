#!/bin/bash

################################################################################
# Clinic App Backup Script
#
# Features:
# - PostgreSQL database backup with pg_dump (custom format + gzip)
# - MinIO object storage backup with mc mirror (optional)
# - Retention policy: 7 daily, 4 weekly, 3 monthly backups
# - Configurable via environment variables
# - Timestamped logging with error handling
################################################################################

set -euo pipefail

# Configuration from environment variables
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-clinic}"
BACKUP_DIR="${BACKUP_DIR:-/backups/postgres}"
MINIO_ALIAS="${MINIO_ALIAS:-minio}"
MINIO_BUCKET="${MINIO_BUCKET:-clinic-storage}"
MINIO_BACKUP_DIR="${MINIO_BACKUP_DIR:-/backups/minio}"

# Retention configuration
DAILY_RETENTION=7
WEEKLY_RETENTION=4
MONTHLY_RETENTION=3

# Timestamp for this backup run
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE=$(date +"%Y-%m-%d")
YEAR_MONTH=$(date +"%Y-%m")
DAY_OF_WEEK=$(date +"%u")  # 1=Monday, 7=Sunday
DAY_OF_MONTH=$(date +"%d")

# Logging functions
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*"
}

log_error() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $*" >&2
}

log_success() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] SUCCESS: $*"
}

# Error handler
cleanup_on_error() {
    log_error "Backup failed. Cleaning up temporary files..."
    exit 1
}

trap cleanup_on_error ERR

################################################################################
# PostgreSQL Backup
################################################################################

backup_postgres() {
    log "Starting PostgreSQL backup..."

    # Create backup directories
    DAILY_DIR="${BACKUP_DIR}/daily"
    WEEKLY_DIR="${BACKUP_DIR}/weekly"
    MONTHLY_DIR="${BACKUP_DIR}/monthly"

    mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

    # Determine backup type and destination
    local BACKUP_TYPE="daily"
    local DEST_DIR="$DAILY_DIR"

    # Weekly backup on Sundays
    if [ "$DAY_OF_WEEK" = "7" ]; then
        BACKUP_TYPE="weekly"
        DEST_DIR="$WEEKLY_DIR"
        log "Performing weekly backup (Sunday)"
    fi

    # Monthly backup on first day of month
    if [ "$DAY_OF_MONTH" = "01" ]; then
        BACKUP_TYPE="monthly"
        DEST_DIR="$MONTHLY_DIR"
        log "Performing monthly backup (1st of month)"
    fi

    # Backup filename
    local BACKUP_FILE="${DEST_DIR}/${POSTGRES_DB}_${TIMESTAMP}.dump"
    local COMPRESSED_FILE="${BACKUP_FILE}.gz"

    log "Backup type: ${BACKUP_TYPE}"
    log "Backup destination: ${COMPRESSED_FILE}"

    # Perform pg_dump
    log "Running pg_dump..."
    export PGPASSWORD="$POSTGRES_PASSWORD"

    if pg_dump \
        --host="$POSTGRES_HOST" \
        --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --format=custom \
        --file="$BACKUP_FILE" \
        --verbose \
        2>&1 | while read -r line; do
            log "pg_dump: $line"
        done
    then
        log_success "pg_dump completed"
    else
        log_error "pg_dump failed"
        rm -f "$BACKUP_FILE"
        exit 1
    fi

    unset PGPASSWORD

    # Compress the backup
    log "Compressing backup with gzip..."
    if gzip -9 "$BACKUP_FILE"; then
        log_success "Compression completed"
        log "Compressed size: $(du -h "$COMPRESSED_FILE" | cut -f1)"
    else
        log_error "Compression failed"
        rm -f "$BACKUP_FILE"
        exit 1
    fi

    # Create symlink to latest backup
    local LATEST_LINK="${BACKUP_DIR}/latest_${BACKUP_TYPE}.dump.gz"
    ln -sf "$COMPRESSED_FILE" "$LATEST_LINK"
    log "Created symlink: ${LATEST_LINK} -> ${COMPRESSED_FILE}"

    log_success "PostgreSQL backup completed: ${COMPRESSED_FILE}"
}

################################################################################
# Backup Retention and Cleanup
################################################################################

apply_retention_policy() {
    log "Applying retention policy..."

    # Daily backups: keep last 7
    log "Cleaning up daily backups (keep ${DAILY_RETENTION})..."
    if [ -d "${BACKUP_DIR}/daily" ]; then
        local daily_count=$(find "${BACKUP_DIR}/daily" -name "*.dump.gz" -type f | wc -l)
        if [ "$daily_count" -gt "$DAILY_RETENTION" ]; then
            find "${BACKUP_DIR}/daily" -name "*.dump.gz" -type f -printf '%T@ %p\n' \
                | sort -n \
                | head -n -${DAILY_RETENTION} \
                | cut -d' ' -f2- \
                | xargs -r rm -v 2>&1 | while read -r line; do
                    log "Removed: $line"
                done
            log_success "Removed $((daily_count - DAILY_RETENTION)) old daily backups"
        else
            log "Daily backups: ${daily_count}/${DAILY_RETENTION} (no cleanup needed)"
        fi
    fi

    # Weekly backups: keep last 4
    log "Cleaning up weekly backups (keep ${WEEKLY_RETENTION})..."
    if [ -d "${BACKUP_DIR}/weekly" ]; then
        local weekly_count=$(find "${BACKUP_DIR}/weekly" -name "*.dump.gz" -type f | wc -l)
        if [ "$weekly_count" -gt "$WEEKLY_RETENTION" ]; then
            find "${BACKUP_DIR}/weekly" -name "*.dump.gz" -type f -printf '%T@ %p\n' \
                | sort -n \
                | head -n -${WEEKLY_RETENTION} \
                | cut -d' ' -f2- \
                | xargs -r rm -v 2>&1 | while read -r line; do
                    log "Removed: $line"
                done
            log_success "Removed $((weekly_count - WEEKLY_RETENTION)) old weekly backups"
        else
            log "Weekly backups: ${weekly_count}/${WEEKLY_RETENTION} (no cleanup needed)"
        fi
    fi

    # Monthly backups: keep last 3
    log "Cleaning up monthly backups (keep ${MONTHLY_RETENTION})..."
    if [ -d "${BACKUP_DIR}/monthly" ]; then
        local monthly_count=$(find "${BACKUP_DIR}/monthly" -name "*.dump.gz" -type f | wc -l)
        if [ "$monthly_count" -gt "$MONTHLY_RETENTION" ]; then
            find "${BACKUP_DIR}/monthly" -name "*.dump.gz" -type f -printf '%T@ %p\n' \
                | sort -n \
                | head -n -${MONTHLY_RETENTION} \
                | cut -d' ' -f2- \
                | xargs -r rm -v 2>&1 | while read -r line; do
                    log "Removed: $line"
                done
            log_success "Removed $((monthly_count - MONTHLY_RETENTION)) old monthly backups"
        else
            log "Monthly backups: ${monthly_count}/${MONTHLY_RETENTION} (no cleanup needed)"
        fi
    fi

    log_success "Retention policy applied"
}

################################################################################
# MinIO Backup (Optional)
################################################################################

backup_minio() {
    # Check if mc (MinIO Client) is available
    if ! command -v mc &> /dev/null; then
        log "MinIO Client (mc) not found - skipping MinIO backup"
        log "Install mc from: https://min.io/docs/minio/linux/reference/minio-mc.html"
        return 0
    fi

    log "Starting MinIO backup..."

    # Create MinIO backup directory with timestamp
    local MINIO_DEST="${MINIO_BACKUP_DIR}/${YEAR_MONTH}"
    mkdir -p "$MINIO_DEST"

    log "Mirroring MinIO bucket: ${MINIO_ALIAS}/${MINIO_BUCKET}"
    log "Destination: ${MINIO_DEST}"

    # Mirror the bucket to local directory
    if mc mirror \
        --preserve \
        --overwrite \
        "${MINIO_ALIAS}/${MINIO_BUCKET}" \
        "${MINIO_DEST}" \
        2>&1 | while read -r line; do
            log "mc: $line"
        done
    then
        log_success "MinIO backup completed"
        log "Backup size: $(du -sh "$MINIO_DEST" | cut -f1)"

        # Create symlink to latest
        local LATEST_MINIO_LINK="${MINIO_BACKUP_DIR}/latest"
        ln -sfn "$MINIO_DEST" "$LATEST_MINIO_LINK"
        log "Created symlink: ${LATEST_MINIO_LINK} -> ${MINIO_DEST}"
    else
        log_error "MinIO backup failed"
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

main() {
    log "========================================="
    log "Clinic App Backup Script"
    log "========================================="
    log "Timestamp: ${TIMESTAMP}"
    log "Configuration:"
    log "  - PostgreSQL: ${POSTGRES_USER}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    log "  - Backup directory: ${BACKUP_DIR}"
    log "  - Retention: ${DAILY_RETENTION} daily, ${WEEKLY_RETENTION} weekly, ${MONTHLY_RETENTION} monthly"
    log "========================================="

    # Check for required tools
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump not found. Please install postgresql-client package."
        exit 1
    fi

    if ! command -v gzip &> /dev/null; then
        log_error "gzip not found. Please install gzip package."
        exit 1
    fi

    # Perform backups
    backup_postgres
    apply_retention_policy

    # Optional MinIO backup
    if [ "${SKIP_MINIO_BACKUP:-false}" != "true" ]; then
        backup_minio || log "MinIO backup failed but continuing..."
    else
        log "MinIO backup skipped (SKIP_MINIO_BACKUP=true)"
    fi

    log "========================================="
    log_success "All backup operations completed successfully"
    log "========================================="

    # Summary
    log "Backup summary:"
    log "  - Daily backups: $(find "${BACKUP_DIR}/daily" -name "*.dump.gz" -type f 2>/dev/null | wc -l)"
    log "  - Weekly backups: $(find "${BACKUP_DIR}/weekly" -name "*.dump.gz" -type f 2>/dev/null | wc -l)"
    log "  - Monthly backups: $(find "${BACKUP_DIR}/monthly" -name "*.dump.gz" -type f 2>/dev/null | wc -l)"

    exit 0
}

# Run main function
main "$@"
