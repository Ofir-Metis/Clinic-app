Check the health status of all running services. Run docker compose ps, then hit each service's /health endpoint to verify they're responding. Report which services are up, down, or unhealthy.

Steps:
1. Run `docker compose ps` to see container status
2. Check API Gateway: `curl -s http://localhost:4000/health`
3. Check each service that's running via its direct port
4. Summarize the results in a clear table
