# Troubleshooting

Common issues and how to resolve them.

## Database Connection Errors
- **Error:** `ECONNREFUSED` when services start.
- **Fix:** Ensure PostgreSQL container is running and `DATABASE_URL` is correct.

## NATS Messaging Failures
- **Error:** `NATS connection closed` in logs.
- **Fix:** Verify `NATS_URL` environment variable and that the nats container is up.

## File Upload Problems
- **Error:** `AccessDenied` from MinIO.
- **Fix:** Check `S3_ACCESS_KEY` and `S3_SECRET_KEY` match MinIO credentials.

Trace IDs are printed in service logs to correlate requests. Enable `DEBUG=app:*` for verbose output.
