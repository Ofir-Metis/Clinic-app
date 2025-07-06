# Infrastructure

This directory contains configuration for local development and cloud resources.

## Docker Compose

`docker-compose.yml` runs dependencies such as PostgreSQL. It is located at
[`infrastructure/docker-compose.yml`](docker-compose.yml).

### Usage

```bash
# Start services
docker compose -f infrastructure/docker-compose.yml up -d

# Apply database migrations
./scripts/migrate.sh
```

`scripts/dev.sh` can also be used to start Compose with build steps.

## Terraform

AWS infrastructure is defined in [`infrastructure/terraform`](terraform).
The main module references submodules from `terraform/modules`.

### Prerequisites

- Terraform >= 1.0
- AWS credentials exported via `AWS_ACCESS_KEY_ID` and
  `AWS_SECRET_ACCESS_KEY` or an active AWS profile.
- Region variable provided via `TF_VAR_region` or passed with `-var`.

Example:

```bash
export AWS_ACCESS_KEY_ID=YOUR_KEY
export AWS_SECRET_ACCESS_KEY=YOUR_SECRET
export TF_VAR_region=us-east-1
```

### Apply Infrastructure

```bash
terraform -chdir=infrastructure/terraform init
terraform -chdir=infrastructure/terraform plan
terraform -chdir=infrastructure/terraform apply
```

Outputs such as the ECS cluster ARN are defined in `outputs.tf`.
