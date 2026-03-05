# Clinic App Backup Script

Automated backup solution for PostgreSQL database and MinIO object storage with intelligent retention policies.

## Features

- **PostgreSQL Backup**: Custom format dumps with gzip compression
- **MinIO Backup**: Optional object storage mirroring
- **Retention Policy**: 7 daily, 4 weekly, 3 monthly backups
- **Smart Scheduling**: Automatic weekly (Sunday) and monthly (1st) detection
- **Error Handling**: Comprehensive logging and exit codes
- **Configurable**: All settings via environment variables

## Quick Start

```bash
# Using default settings (localhost PostgreSQL)
./scripts/backup.sh

# With custom configuration
POSTGRES_HOST=db.example.com \
POSTGRES_DB=clinic_prod \
BACKUP_DIR=/mnt/backups \
./scripts/backup.sh
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DB` | `clinic` | Database name |
| `BACKUP_DIR` | `/backups/postgres` | Backup root directory |
| `MINIO_ALIAS` | `minio` | MinIO client alias |
| `MINIO_BUCKET` | `clinic-storage` | MinIO bucket name |
| `MINIO_BACKUP_DIR` | `/backups/minio` | MinIO backup directory |
| `SKIP_MINIO_BACKUP` | `false` | Set to `true` to skip MinIO |

### Directory Structure

```
/backups/postgres/
├── daily/
│   ├── clinic_2026-02-10_14-30-00.dump.gz
│   ├── clinic_2026-02-11_14-30-00.dump.gz
│   └── ... (up to 7 files)
├── weekly/
│   ├── clinic_2026-02-09_14-30-00.dump.gz (Sunday)
│   └── ... (up to 4 files)
├── monthly/
│   ├── clinic_2026-02-01_14-30-00.dump.gz
│   └── ... (up to 3 files)
├── latest_daily.dump.gz -> daily/clinic_2026-02-11_14-30-00.dump.gz
├── latest_weekly.dump.gz -> weekly/clinic_2026-02-09_14-30-00.dump.gz
└── latest_monthly.dump.gz -> monthly/clinic_2026-02-01_14-30-00.dump.gz
```

## Retention Policy

- **Daily**: Last 7 backups (every run creates one)
- **Weekly**: Last 4 backups (created on Sundays)
- **Monthly**: Last 3 backups (created on 1st of month)

**Note**: Weekly and monthly backups are stored in separate directories and don't count against daily retention.

## Scheduling with Cron

### Development (Daily at 2 AM)

```bash
# Edit crontab
crontab -e

# Add this line
0 2 * * * cd /home/ofir/Documents/Clinic-app && ./scripts/backup.sh >> /var/log/clinic-backup.log 2>&1
```

### Production (Daily at 2 AM with environment file)

```bash
# Create environment file
cat > /etc/clinic-backup.env << 'EOF'
POSTGRES_HOST=production-db.internal
POSTGRES_PORT=5432
POSTGRES_USER=backup_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=clinic_production
BACKUP_DIR=/mnt/backups/clinic
MINIO_ALIAS=production-minio
MINIO_BUCKET=clinic-storage
MINIO_BACKUP_DIR=/mnt/backups/clinic-minio
EOF

chmod 600 /etc/clinic-backup.env

# Add to crontab
0 2 * * * set -a && . /etc/clinic-backup.env && /opt/clinic-app/scripts/backup.sh >> /var/log/clinic-backup.log 2>&1
```

### Using systemd timer (Recommended for production)

Create `/etc/systemd/system/clinic-backup.service`:

```ini
[Unit]
Description=Clinic App Database Backup
After=network.target postgresql.service

[Service]
Type=oneshot
User=backup
EnvironmentFile=/etc/clinic-backup.env
WorkingDirectory=/opt/clinic-app
ExecStart=/opt/clinic-app/scripts/backup.sh
StandardOutput=journal
StandardError=journal
SyslogIdentifier=clinic-backup
```

Create `/etc/systemd/system/clinic-backup.timer`:

```ini
[Unit]
Description=Daily Clinic App Backup
Requires=clinic-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable clinic-backup.timer
systemctl start clinic-backup.timer

# Check status
systemctl status clinic-backup.timer
systemctl list-timers clinic-backup.timer
```

## Restore Process

### PostgreSQL Restore

```bash
# Decompress backup
gunzip /backups/postgres/daily/clinic_2026-02-10_14-30-00.dump.gz

# Restore to database
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=clinic \
  --clean \
  --if-exists \
  --verbose \
  /backups/postgres/daily/clinic_2026-02-10_14-30-00.dump

# Or restore to new database
createdb -U postgres clinic_restored
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=clinic_restored \
  --verbose \
  /backups/postgres/daily/clinic_2026-02-10_14-30-00.dump
```

### MinIO Restore

```bash
# Mirror backup back to MinIO
mc mirror \
  --overwrite \
  /backups/minio/2026-02/ \
  minio/clinic-storage
```

## MinIO Client Setup

If you want MinIO backups, install and configure the MinIO client:

```bash
# Install MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure alias
mc alias set minio http://localhost:9000 minioadmin minioadmin

# Test connection
mc ls minio
```

## Monitoring and Alerts

### Check Last Backup

```bash
# View latest backup timestamp
ls -lh /backups/postgres/latest_daily.dump.gz

# Check backup log
tail -100 /var/log/clinic-backup.log
```

### Monitor with systemd

```bash
# View recent backup logs
journalctl -u clinic-backup.service -n 100

# Follow backup logs in real-time
journalctl -u clinic-backup.service -f
```

### Alert on Failure (with systemd)

Create `/etc/systemd/system/clinic-backup-failure@.service`:

```ini
[Unit]
Description=Backup Failure Alert

[Service]
Type=oneshot
ExecStart=/usr/bin/systemd-cat -t clinic-backup-alert echo "CRITICAL: Clinic backup failed for %i"
ExecStart=/usr/bin/mail -s "Clinic Backup Failed" admin@example.com
```

Add to `clinic-backup.service`:

```ini
[Unit]
OnFailure=clinic-backup-failure@%n.service
```

## Troubleshooting

### Permission Denied

```bash
# Ensure backup directory is writable
sudo mkdir -p /backups/postgres
sudo chown -R $USER:$USER /backups

# Or use user-specific directory
BACKUP_DIR=$HOME/backups ./scripts/backup.sh
```

### pg_dump Not Found

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# RHEL/CentOS
sudo yum install postgresql

# Verify
which pg_dump
```

### Connection Refused

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Test connection
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c '\l'
```

### Disk Space Issues

```bash
# Check available space
df -h /backups

# Manually clean old backups
find /backups/postgres/daily -name "*.dump.gz" -mtime +7 -delete
```

## Security Best Practices

1. **Encrypt backups at rest**: Use encrypted filesystem or encrypt archives
2. **Secure credentials**: Never commit `.env` files with passwords
3. **Restrict permissions**: `chmod 600` on environment files
4. **Off-site backups**: Sync to S3/Glacier for disaster recovery
5. **Test restores**: Regularly verify backups can be restored
6. **Audit logs**: Monitor backup logs for unauthorized access

## Example: Off-site S3 Sync

```bash
# Install AWS CLI
pip install awscli

# Sync backups to S3 after local backup
./scripts/backup.sh && \
aws s3 sync \
  /backups/postgres \
  s3://clinic-backups/postgres \
  --storage-class GLACIER \
  --exclude "latest_*"
```

## License

MIT - Clinic App Backup System
