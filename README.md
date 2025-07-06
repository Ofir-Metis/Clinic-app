# Clinic App

## Backend

### Prerequisites

- Docker and Docker Compose
- Yarn 1.22+
- AWS credentials for Terraform

### Local Development

```bash
cp .env.example .env
yarn install
./scripts/dev.sh
```

Ensure `.env` defines `API_URL`, `DATABASE_URL`, and `NATS_URL` for the services.

Individual services can be started in watch mode:

```bash
yarn workspace auth-service start:dev
yarn workspace appointments-service start:dev
yarn workspace notes-service start:dev
yarn workspace analytics-service start:dev
yarn workspace therapists-service start:dev
```

### Testing

```bash
./scripts/test.sh
```

### Deployment

```bash
terraform -chdir=infrastructure/terraform init
terraform -chdir=infrastructure/terraform apply
```

GitHub Actions will build Docker images and run Terraform on merges to `main`.

## Auth Service

### Setup

```bash
cp .env.example .env
cd services/auth-service
npm install
```

### Run

```bash
npm run start:dev
```

### Test

```bash
npm test
```

## Settings Service

See [docs/Settings.md](docs/Settings.md) for API details.

### Adding patients

Navigate to `/patients/new` in the frontend. Fill in the patient information and submit. An invitation email and WhatsApp message will be sent if the patient does not already exist.

## Frontend

### Setup

```bash
cp frontend/.env.example frontend/.env
cd frontend
npm install
```

### Run

```bash
npm run dev
```

The frontend expects `VITE_API_URL` in `.env` pointing to the API gateway. The
API gateway should be configured with `FRONTEND_ORIGIN` to enable CORS.
`APPOINTMENTS_SERVICE_URL` should point to the appointments service for direct requests.
The Treatment History page fetches appointments from this API and displays them in calendar or list views.

### Test

```bash
npm test
```
