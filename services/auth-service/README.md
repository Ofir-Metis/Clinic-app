# Auth Service

NestJS service providing JWT authentication.

## Development

```bash
yarn install
yarn start:dev
```

Environment variables:
- `DATABASE_URL` – PostgreSQL connection string
- `JWT_SECRET` – secret used to sign tokens
- `NATS_URL` – NATS broker URL

## Testing

```bash
yarn test
```
