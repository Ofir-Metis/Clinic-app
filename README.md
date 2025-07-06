# Clinic App

A comprehensive microservices platform for managing clinic operations, including scheduling, session notes and a client portal with an integrated AI assistant.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Local Setup \(Windows\)](#local-setup-windows)
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

**Tech Stack**

- **Frontend** – React with Vite and Material-UI.
- **Backend** – NestJS microservices using TypeORM with PostgreSQL.
- **Messaging** – NATS for service communication.
- **Infrastructure** – Docker, Docker Compose, Terraform.
- **Cloud** – Google Cloud (Cloud Run) and AWS (ECS Fargate).

## Prerequisites

- **Node.js** LTS (18.x recommended)
- **Yarn** package manager
- **Docker** and **Docker Compose**
- **Git**
- **Cloud CLIs**: [gcloud](https://cloud.google.com/sdk/docs/install), [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), [Terraform](https://developer.hashicorp.com/terraform/install)
- **OS Notes**
  - *Windows*: Use [WSL2](https://learn.microsoft.com/windows/wsl/install) for the best experience.
  - *macOS/Linux*: Ensure Docker Desktop or docker engine is installed.

## Local Setup (Windows)

```bash
# clone repository
git clone https://github.com/yourorg/clinic-app.git
cd clinic-app

# install nvm and Node 18
nvm install 18
nvm use 18

# install dependencies
corepack enable
yarn install

# environment variables
cp .env.example .env

# start services
docker compose up -d

# run database migrations
yarn workspace api-gateway run migration:run

# start backend and frontend
yarn workspace api-gateway start:dev
cd frontend && yarn dev
```

### Tests and Lint

```bash
# from repository root
yarn lint
yarn test
```

## Google Cloud Deployment

1. **Enable APIs**: Cloud Run, Artifact Registry, Secret Manager.
2. **Configure gcloud**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Build & Push Images**:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/api-gateway services/api-gateway
   ```
4. **Deploy**:
   ```bash
   gcloud run deploy api-gateway --image gcr.io/YOUR_PROJECT_ID/api-gateway --platform managed --allow-unauthenticated
   ```
5. Use separate Cloud Run services for staging and production. Environment variables are provided via Secret Manager.

## AWS Deployment

1. **Create ECR repositories** for each service.
2. **Build & Push**:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
   docker build -t auth-service services/auth-service
   docker tag auth-service:latest <account>.dkr.ecr.<region>.amazonaws.com/auth-service:latest
   docker push <account>.dkr.ecr.<region>.amazonaws.com/auth-service:latest
   ```
3. **ECS Fargate** task definitions and services are managed with Terraform stubs in `infrastructure/terraform`.
4. **CI/CD** via GitHub Actions builds images and updates ECS services.
5. Configure an Application Load Balancer with SSL using ACM certificates.

## Configuration & Environment Variables

Create a `.env` file based on `.env.example` and provide the following keys:


When connecting to a remote database, update `DATABASE_URL` accordingly.
=======
| Key | Description | Source |
|-----|-------------|--------|
| `POSTGRES_HOST` | Database host | Docker Compose service name `postgres` |
| `POSTGRES_PORT` | Database port | Default port 5432 defined in `docker-compose.yml` |
| `POSTGRES_USER` | Database user | Docker Compose environment variable `POSTGRES_USER` |
| `POSTGRES_PASSWORD` | Database password | Docker Compose environment variable `POSTGRES_PASSWORD` |
| `POSTGRES_DB` | Database name | Docker Compose environment variable `POSTGRES_DB` |
| `JWT_SECRET` | JWT signing secret | Generate a random 32-character string, e.g. `openssl rand -hex 16` |
| `NATS_URL` | NATS connection string | NATS container URL from Docker Compose (e.g. `nats://nats:4222`) |
| `S3_ENDPOINT` | S3 or MinIO endpoint | From your MinIO or S3 service endpoint |
| `S3_ACCESS_KEY` | S3 access key | From your MinIO or S3 access key |
| `S3_SECRET_KEY` | S3 secret key | From your MinIO or S3 secret key |
| `FRONTEND_ORIGIN` | Allowed CORS origin | URL where your frontend is hosted |
| `API_URL` | API Gateway URL | URL where your API Gateway is hosted |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | Google OAuth client ID from Google Cloud Console |
| `GOOGLE_CLIENT_ID` | Backend OAuth client ID | Google OAuth client ID from Google Cloud Console |
| `EMAIL_USER` | SMTP username | SMTP username from your provider console |
| `EMAIL_PASS` | SMTP password | SMTP password from your provider console |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | From your Twilio console |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | From your Twilio console |
| `OPENAI_API_KEY` | OpenAI API key | From the OpenAI dashboard |
| `APPOINTMENTS_URL` | Appointments service URL | URL of the appointments service |
| `NOTES_URL` | Notes service URL | URL of the notes service |
| `ANALYTICS_URL` | Analytics service URL | URL of the analytics service |
| `THERAPISTS_URL` | Therapists service URL | URL of the therapists service |
| `SETTINGS_URL` | Settings service URL | URL of the settings service |
| `VITE_API_URL` | Frontend API URL | Frontend variable pointing to API Gateway URL |
| `SMTP_HOST` | SMTP host | From your SMTP provider console |
| `SMTP_PORT` | SMTP port | From your SMTP provider console |
| `SMTP_USER` | SMTP user | From your SMTP provider console |
| `SMTP_PASS` | SMTP password | From your SMTP provider console |
| `WHATSAPP_FROM` | WhatsApp sender number | WhatsApp sender number from Twilio |
| `APP_URL` | Application base URL | Base URL of your application |
| `DATABASE_URL` | TypeORM connection string | Build using the above values in `postgres://USER:PASSWORD@HOST:PORT/DB` format |
| `WHATSAPP_API_KEY` | WhatsApp API key | WhatsApp API key from your provider |
| `SMTP_URL` | Full SMTP URL | From your SMTP provider console |
| `PAYMENT_GATEWAY_KEY` | Payment provider key | From your Stripe dashboard |
| `STRIPE_SECRET` | Stripe secret key | From your Stripe dashboard |

Secrets should be stored in **AWS Secrets Manager** or **GCP Secret Manager** and injected at runtime.

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

Common issues are documented in [docs/Troubleshooting.md](docs/Troubleshooting.md).
Check container logs with `docker compose logs -f <service>` and enable debug output with `DEBUG=app:*`.

For live support, contact the team or use the integrated AI assistant in the app.

## Contributing & Governance

1. Fork the repository and create feature branches from `main`.
2. Follow Conventional Commits for commit messages.
3. Open a pull request and request review.
4. See issue templates and roadmap in the repository for guidance.

## Changelog & Versioning

This project follows [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](CHANGELOG.md) for release notes.

