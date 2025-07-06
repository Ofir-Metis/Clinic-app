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

