Debug a specific service by examining its logs, health, and configuration. The service name is provided as: $ARGUMENTS

Steps:
1. Check if the service container is running: `docker compose ps $ARGUMENTS`
2. Get recent logs: `docker compose logs --tail 50 $ARGUMENTS`
3. Check the service's health endpoint if it has an exposed port
4. Read the service's main.ts and app.module.ts to understand its configuration
5. Check for any TypeORM entity sync issues in the logs
6. Summarize findings and suggest fixes for any issues found
