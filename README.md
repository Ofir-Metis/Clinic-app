# Clinic App

A comprehensive microservices platform for managing clinic operations, including scheduling, session notes and a client portal with an integrated AI assistant.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Setup \(Windows\)](#local-setup-windows)
- [Local Setup \(Linux\)](#local-setup-linux)
- [Google Cloud Deployment](#google-cloud-deployment)
- [AWS Deployment](#aws-deployment)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Microservices & Architecture](#microservices--architecture)
- [Code Quality & Testing](#code-quality--testing)
- [CI/CD & Infrastructure-as-Code](#cicd--infrastructure-as-code)
- [Troubleshooting & Support](#troubleshooting--support)
- [Contributing & Governance](#contributing--governance)
- [Changelog & Versioning](#changelog--versioning)

## Project Overview

Clinic App is a full stack application for therapists and clinics. Core features include:

- **Scheduling** – manage appointments and availability.
- **Session Notes** – secure note taking per session.
- **Client Portal** – clients can view history and upcoming sessions.
- **AI Assistant** – integrated GPT assistant for insights and recommendations.
- **Notifications Center** – view alerts at `/notifications`.

**Tech Stack**

- **Frontend** – React with Vite and Material-UI.
- **Backend** – NestJS microservices using TypeORM with PostgreSQL.
- **Messaging** – NATS for service communication.
- **Infrastructure** – Docker, Docker Compose, Terraform.
- **Cloud** – Google Cloud (Cloud Run) and AWS (ECS Fargate).

## Prerequisites

- **Node.js** LTS (**20.x or higher required**)
- **Yarn** package manager (install globally with `npm install -g yarn`)
- **Docker** and **Docker Compose**
- **Git**
- **Cloud CLIs**: [gcloud](https://cloud.google.com/sdk/docs/install), [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), [Terraform](https://developer.hashicorp.com/terraform/install)
 - **OS Notes**
   - *Windows*: Use [WSL2](https://learn.microsoft.com/windows/wsl/install) for the best experience.
   - *macOS/Linux*: Ensure Docker Desktop or docker engine is installed.

## Quick Start

```bash
# Make sure you are using Node.js 20+
nvm install 20
nvm use 20

# Install Yarn globally if not already installed
npm install -g yarn

# Clone and set up the project
git clone https://github.com/yourorg/clinic-app.git
cd clinic-app

# Install dependencies
corepack enable
yarn install

# Build shared utilities
yarn workspace @clinic/common build

# Copy environment variables
cp .env.example .env

# Start all services
./scripts/dev.sh

# Run linting and tests
./scripts/test.sh
```

Use `docker compose` for running all services together (as in `scripts/dev.sh`).
Run `yarn` commands within individual workspaces when developing or testing a
single service.

## Navigation

The application features a teal bottom navigation bar with quick links to **Home**,
**Calendar**, **Tools**, **Notifications**, and **Settings**. The active item is highlighted.
Below is a screenshot of the updated navigation:

![Navigation](docs/navigation.png)

## Local Setup (Windows)

```bash
# clone repository
git clone https://github.com/yourorg/clinic-app.git
cd clinic-app

# install nvm and Node 18
nvm install 20
nvm use 20

# environment variables
cp .env.example .env

# install dependencies
corepack enable
yarn install

# build shared utilities
yarn workspace @clinic/common build
yarn workspace analytics-service build
yarn workspace api-gateway run build
yarn workspace auth-service run build
yarn workspace appointments-service run build
yarn workspace files-service run build
yarn workspace ai-service run build
yarn workspace notes-service run build
yarn workspace notifications-service run build

docker compose build

# start services
docker compose up -d

# run database migrations
yarn workspace api-gateway run migration:run

# start backend and frontend
yarn workspace api-gateway start:dev

cd frontend 
yarn dev

cd services\auth-service
yarn start
```

## Local Setup (Linux)

```bash
# clone repository
git clone https://github.com/yourorg/clinic-app.git
cd clinic-app

# install nvm and Node 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# install dependencies
corepack enable
yarn install

# build shared utilities
yarn workspace @clinic/common build

# environment variables
cp .env.example .env

# start services
docker compose up -d

# run database migrations
yarn workspace api-gateway run migration:run

# start backend and frontend
yarn workspace api-gateway start:dev &
cd frontend && yarn dev
```

### Tests and Lint

```bash
# from repository root
./scripts/test.sh
```

## Google Cloud Deployment

1. **Enable APIs**: Cloud Run, Artifact Registry, Secret Manager.
2. **Configure gcloud**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud config set run/region us-central1
   ```
3. **Build & Push Images** for each service:
   ```bash
   gcloud builds submit --tag gcr.io/$GOOGLE_PROJECT_ID/api-gateway services/api-gateway
   # repeat for other services as needed
   ```

### Staging

1. Create a staging Cloud Run service and supply staging secrets:
   ```bash
   gcloud run deploy api-gateway-staging \
     --image gcr.io/$GOOGLE_PROJECT_ID/api-gateway \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars=ENVIRONMENT=staging
   ```
2. Store environment variables in Secret Manager and reference them with `--update-secrets`.

### Production

1. Deploy the production service using a separate Cloud Run instance:
   ```bash
   gcloud run deploy api-gateway-prod \
     --image gcr.io/$GOOGLE_PROJECT_ID/api-gateway \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars=ENVIRONMENT=production
   ```
2. Provision production secrets in Secret Manager and reference them during deployment.

## AWS Deployment

1. **Create ECR repositories** for each service.
2. **Build & Push Images**:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker build -t auth-service services/auth-service
   docker tag auth-service:latest <account>.dkr.ecr.<region>.amazonaws.com/auth-service:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/auth-service:latest
   # repeat for additional services
   ```

### Staging

1. Select the `staging` Terraform workspace or create it if missing:
   ```bash
   terraform -chdir=infrastructure/terraform workspace new staging || true
   terraform -chdir=infrastructure/terraform workspace select staging
   terraform -chdir=infrastructure/terraform apply -var environment=staging
   ```
2. ECS services will pull the latest images from the staging ECR repositories.

### Production

1. Repeat using the `production` workspace:
   ```bash
   terraform -chdir=infrastructure/terraform workspace new production || true
   terraform -chdir=infrastructure/terraform workspace select production
   terraform -chdir=infrastructure/terraform apply -var environment=production
   ```
2. Configure an Application Load Balancer with ACM certificates for SSL.
3. CI/CD via GitHub Actions updates images and triggers deployments when commits reach the `main` branch.

## Configuration & Environment Variables

Create a `.env` file based on `.env.example` and provide the following keys:


| Key | Description | Source |
|-----|-------------|--------|
| `POSTGRES_HOST` | Database host | `postgres` |
| `POSTGRES_PORT` | Database port | `5432` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_DB` | Database name | `clinic` |
| `JWT_SECRET` | JWT signing secret | `change-me` - change for production |
| `NATS_URL` | NATS connection string | `nats://localhost:4222` - change for production |
| `S3_ENDPOINT` | S3 or MinIO endpoint | `http://localhost:9000` - change for production |
| `S3_ACCESS_KEY` | S3 access key | `your-access-key` - change for production |
| `S3_SECRET_KEY` | S3 secret key | `your-secret-key` - change for production |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:5173` - change for production |
| `API_URL` | API Gateway URL | `http://localhost:3000` - change for production |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-google-client-id` - change for production |
| `GOOGLE_CLIENT_ID` | Backend OAuth client ID | `your-google-client-id` - change for production |
| `EMAIL_USER` | SMTP username | `your-email@example.com` - change for production |
| `EMAIL_PASS` | SMTP password | `your-email-password` - change for production |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | `your-twilio-sid` - change for production |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | `your-twilio-token` - change for production |
| `TWILIO_FROM` | Default SMS sender number | `+1234567890` - change for production |
| `OPENAI_API_KEY` | OpenAI API key | `your-openai-key` - change for production |
| `APPOINTMENTS_URL` | Appointments service URL | `http://appointments-service:3000` |
| `NOTES_URL` | Notes service URL | `http://notes-service:3000` |
| `ANALYTICS_URL` | Analytics service URL | `http://analytics-service:3000` |
| `THERAPISTS_URL` | Therapists service URL | `http://therapists-service:3000` |
| `SETTINGS_URL` | Settings service URL | `http://settings-service:3000` |
| `VITE_API_URL` | Frontend API URL | `http://localhost:3000` - change for production |
| `SMTP_HOST` | SMTP host | `maildev` |
| `SMTP_PORT` | SMTP port | `1025` |
| `SMTP_USER` | SMTP user | `` - change for production |
| `SMTP_PASS` | SMTP password | `` - change for production |
| `WHATSAPP_FROM` | WhatsApp sender number | `whatsapp:+1234567890` |
| `APP_URL` | Application base URL | `http://localhost:5173` - change for production |
| `DATABASE_URL` | TypeORM connection string | `postgres://user:pass@localhost:5432/clinic` - change for production |
| `WHATSAPP_API_KEY` | WhatsApp API key | `your-whatsapp-key` - change for production |
| `SMTP_URL` | Full SMTP URL | `smtp://user:pass@localhost:1025` - change for production |
| `PAYMENT_GATEWAY_KEY` | Payment provider key | `your-payment-key` - change for production |
| `STRIPE_SECRET` | Stripe secret key | `your-stripe-secret` - change for production |

When connecting to a remote database, update `DATABASE_URL` accordingly.

Secrets should be stored in **AWS Secrets Manager** or **GCP Secret Manager** and injected at runtime.

### Frontend Environment Variables

Copy the example environment file for the React application and adjust the values as needed:

```bash
cp frontend/.env.example frontend/.env
```

| Key | Description | Default |
|-----|-------------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID used in the browser | `your-google-client-id` |
| `VITE_API_URL` | Base URL for the API gateway | `http://localhost:3000` |
| `THERAPIST_SERVICE_URL` | URL for the therapists service | `http://localhost:3000` |
| `APPOINTMENTS_SERVICE_URL` | URL for the appointments service | `http://localhost:3000` |

## Microservices & Architecture

The repository is structured as follows:

```
services/        # NestJS microservices
frontend/        # React app
infrastructure/  # Docker Compose and Terraform configs
scripts/         # Helper scripts
docs/            # Documentation
```

Each service can run independently:

```bash
# example
cd services/auth-service
yarn start:dev
```

Using Docker Compose starts all services together for local development.

## Docker Compose & Terraform

The Compose file [`infrastructure/docker-compose.yml`](infrastructure/docker-compose.yml)
defines local dependencies. Start everything with:

```bash
./scripts/dev.sh
```

AWS resources are managed with Terraform modules in
[`infrastructure/terraform`](infrastructure/terraform). Before applying, export
AWS credentials and set the region:

```bash
export AWS_ACCESS_KEY_ID=YOUR_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET
export TF_VAR_region=us-east-1
```

Initialize and apply:

```bash
terraform -chdir=infrastructure/terraform init
terraform -chdir=infrastructure/terraform apply
```

More details are available in [infrastructure/README.md](infrastructure/README.md).

## Code Quality & Testing

- **ESLint** and **Prettier** enforce code style via Husky hooks.
- **Jest** is configured for unit and integration tests with a coverage threshold of 80%.

Run locally with:

```bash
yarn lint
yarn test
```

## CI/CD & Infrastructure-as-Code

GitHub Actions workflow [`ci.yml`](.github/workflows/ci.yml) runs lint, tests, builds Docker images, and applies Terraform. Terraform stubs in `infrastructure/terraform` manage AWS ECS, RDS and S3 resources.

## Troubleshooting & Support

### Common Issues

- **Node version errors:**
  - The project requires Node.js 20 or higher. Use `nvm install 20 && nvm use 20`.
- **Yarn not found:**
  - Install globally: `npm install -g yarn`.
- **Yarn workspace errors:**
  - Use the `-W` flag for root-level dependency changes, e.g. `yarn add -W <package>`.
- **ts-morph TypeScript errors:**
  - If you see errors about `MapIterator`, downgrade ts-morph: `yarn add -W ts-morph@17.0.1`.
- **NestJS GraphQL 'Query root type must be provided':**
  - Ensure at least one `@Query()` is defined in a resolver (see `app.resolver.ts` for a dummy example).
- **Docker build fails on JSON files:**
  - Validate all translation files in `frontend/src/i18n/` for correct JSON syntax.

More issues are documented in [docs/Troubleshooting.md](docs/Troubleshooting.md).
Check container logs with `docker compose logs -f <service>` and enable debug output with `DEBUG=app:*`.

For live support, contact the team or use the integrated AI assistant in the app.

## Contributing & Governance

1. Fork the repository and create feature branches from `main`.
2. Follow Conventional Commits for commit messages.
3. Open a pull request and request review.
4. See issue templates and roadmap in the repository for guidance.

## Changelog & Versioning

This project follows [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](CHANGELOG.md) for release notes.

