# Settings Service

This service manages user settings via a simple REST API.

## Endpoints

- `GET /settings` – Return all settings for the authenticated user.
- `PUT /settings` – Replace or update user settings. Accepts an array of `{ key, value, category? }`.
- `GET /health` – Health check.

All endpoints require JWT Bearer authentication.

Swagger UI is available at `/swagger` when the service is running.
