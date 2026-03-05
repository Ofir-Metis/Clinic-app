# Backup Script Quick Reference

## Run Backup

```bash
# Local development (default settings)
./scripts/backup.sh

# With custom settings
BACKUP_DIR=$HOME/backups ./scripts/backup.sh

# Skip MinIO backup
SKIP_MINIO_BACKUP=true ./scripts/backup.sh

# Using environment file
source scripts/.env.backup && ./scripts/backup.sh
```

## Restore Database

```bash
# 1. Find your backup
ls -lh /backups/postgres/daily/

# 2. Decompress
gunzip /backups/postgres/daily/clinic_2026-02-10_14-30-00.dump.gz

# 3. Restore (WARNING: this will drop existing data)
pg_restore \
  --host=localhost \
  --username=postgres \
  --dbname=clinic \
  --clean \
  --if-exists \
  /backups/postgres/daily/clinic_2026-02-10_14-30-00.dump

# Or restore to new database (safer)
createdb clinic_restored
pg_restore --dbname=clinic_restored /backups/postgres/daily/clinic_2026-02-10_14-30-00.dump
```

## Schedule with Cron

```bash
# Edit crontab
crontab -e

# Daily at 2 AM
0 2 * * * cd /home/ofir/Documents/Clinic-app && ./scripts/backup.sh >> /var/log/clinic-backup.log 2>&1
```

## Check Backup Status

```bash
# List all backups
ls -lh /backups/postgres/{daily,weekly,monthly}/

# Show latest backup
ls -lh /backups/postgres/latest_daily.dump.gz

# Count backups
echo "Daily: $(ls /backups/postgres/daily/*.gz 2>/dev/null | wc -l)"
echo "Weekly: $(ls /backups/postgres/weekly/*.gz 2>/dev/null | wc -l)"
echo "Monthly: $(ls /backups/postgres/monthly/*.gz 2>/dev/null | wc -l)"

# Check backup log
tail -50 /var/log/clinic-backup.log
```

## Common Issues

### "pg_dump: command not found"
```bash
# Install PostgreSQL client
sudo apt-get install postgresql-client
```

### "Permission denied" on /backups
```bash
# Use home directory instead
BACKUP_DIR=$HOME/backups ./scripts/backup.sh
```

### "Connection refused"
```bash
# Start PostgreSQL
docker compose up -d postgres

# Or check connection
PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic -c '\l'
```

## Directory Structure

```
/backups/postgres/
├── daily/           # Last 7 days
├── weekly/          # Last 4 weeks (Sundays)
├── monthly/         # Last 3 months (1st of month)
└── latest_*.gz      # Symlinks to most recent
```

## Testing Your Backup

```bash
# 1. Create test database
createdb clinic_test

# 2. Restore backup
pg_restore --dbname=clinic_test /backups/postgres/latest_daily.dump.gz

# 3. Verify data
PGPASSWORD=postgres psql -h localhost -U postgres -d clinic_test -c "SELECT COUNT(*) FROM users;"

# 4. Clean up
dropdb clinic_test
```

## Documentation

See `scripts/backup.README.md` for full documentation.
