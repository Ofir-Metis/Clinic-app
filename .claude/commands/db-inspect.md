Inspect the database schema and data. Optional table name as: $ARGUMENTS

Steps:
1. Connect to the database: `PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d clinic`
2. If no specific table requested, list all tables: `\dt`
3. If a table name is provided, show its schema: `\d $ARGUMENTS` and sample data: `SELECT * FROM $ARGUMENTS LIMIT 10`
4. Show row counts for relevant tables
5. Check for any orphaned records or data integrity issues if relevant
6. Present findings in a clear format
