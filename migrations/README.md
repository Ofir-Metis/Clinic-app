# Database Migrations

This directory contains SQL migration scripts for the Clinic App database schema changes.

## Migration Order

Migrations should be run in numerical order:

1. `001-rename-patients-to-clients.sql` - Renames patients table to clients
2. `002-rename-therapist-profiles-to-coach-profiles.sql` - Renames therapist_profiles to coach_profiles

## How to Run Migrations

### Using psql

```bash
# Connect to the database
psql -h localhost -p 5432 -U postgres -d clinic

# Run migrations in order
\i migrations/001-rename-patients-to-clients.sql
\i migrations/002-rename-therapist-profiles-to-coach-profiles.sql
```

### Using Docker

```bash
# Copy migration files to container
docker cp migrations/ clinic-app-postgres-1:/tmp/

# Execute in container
docker exec -it clinic-app-postgres-1 psql -U postgres -d clinic -f /tmp/migrations/001-rename-patients-to-clients.sql
docker exec -it clinic-app-postgres-1 psql -U postgres -d clinic -f /tmp/migrations/002-rename-therapist-profiles-to-coach-profiles.sql
```

### Using npm/yarn scripts

```bash
# From project root
yarn workspace @clinic/common migration:run
```

## Pre-Migration Checklist

⚠️ **IMPORTANT**: Before running migrations in production:

1. **Backup your database**
   ```bash
   pg_dump -h localhost -U postgres -d clinic > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Stop all services** that are accessing the database
   ```bash
   docker compose stop api-gateway appointments-service files-service
   ```

3. **Verify database connection**
   ```bash
   psql -h localhost -p 5432 -U postgres -d clinic -c "SELECT NOW();"
   ```

4. **Test on development/staging first**

## Post-Migration Steps

After running migrations:

1. **Verify tables were renamed**
   ```sql
   \dt clients
   \dt coach_profiles
   ```

2. **Check indexes**
   ```sql
   \di clients*
   \di coach_profiles*
   ```

3. **Restart services**
   ```bash
   docker compose up -d
   ```

4. **Run smoke tests**
   ```bash
   yarn test
   ```

## Rollback

Each migration file includes commented rollback scripts at the bottom.

To rollback:

1. Stop all services
2. Copy the rollback section from the migration file
3. Run it in psql
4. Restart services with old code

## Migrations Log

The `migrations` table tracks which migrations have been executed:

```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

## Troubleshooting

### Migration already applied

If you get an error that a table already exists or doesn't exist:

1. Check if the migration was already run:
   ```sql
   SELECT * FROM migrations WHERE name = '001-rename-patients-to-clients';
   ```

2. If yes, skip that migration
3. If no but tables are renamed, manually insert the migration record:
   ```sql
   INSERT INTO migrations (name, executed_at) VALUES ('001-rename-patients-to-clients', NOW());
   ```

### Foreign key conflicts

If you encounter foreign key constraint errors:

1. Check which tables reference the old table names:
   ```sql
   SELECT * FROM information_schema.table_constraints
   WHERE constraint_type = 'FOREIGN KEY'
   AND constraint_name LIKE '%patient%';
   ```

2. Drop problematic constraints temporarily
3. Run migration
4. Recreate constraints with new table names

## Notes

- All migrations use `IF EXISTS` clauses to be idempotent
- Migrations are wrapped in transactions for safety
- Both camelCase and snake_case column names are handled
- Migrations create entries in the `migrations` table for tracking
