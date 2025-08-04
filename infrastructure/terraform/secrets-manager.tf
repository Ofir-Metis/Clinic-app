# AWS Secrets Manager for Clinic App
resource "aws_secretsmanager_secret" "clinic_app_secrets" {
  name                    = "clinic-app-secrets-${var.environment}"
  description             = "Secrets for Clinic App ${var.environment} environment"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Environment = var.environment
    Application = "clinic-app"
    ManagedBy   = "terraform"
  }
}

# Secret version with initial values
resource "aws_secretsmanager_secret_version" "clinic_app_secrets" {
  secret_id = aws_secretsmanager_secret.clinic_app_secrets.id
  secret_string = jsonencode({
    POSTGRES_PASSWORD    = var.postgres_password
    JWT_SECRET          = var.jwt_secret
    OPENAI_API_KEY      = var.openai_api_key
    TWILIO_AUTH_TOKEN   = var.twilio_auth_token
    S3_SECRET_KEY       = var.s3_secret_key
    STRIPE_SECRET_KEY   = var.stripe_secret_key
    TRANZILLA_API_KEY   = var.tranzilla_api_key
    GOOGLE_CLIENT_SECRET = var.google_client_secret
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# IAM role for ECS tasks to access secrets
resource "aws_iam_role" "ecs_secrets_role" {
  name = "clinic-app-ecs-secrets-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = "clinic-app"
  }
}

# IAM policy for secrets access
resource "aws_iam_role_policy" "ecs_secrets_policy" {
  name = "clinic-app-secrets-policy-${var.environment}"
  role = aws_iam_role.ecs_secrets_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.clinic_app_secrets.arn
      }
    ]
  })
}

# Variables for sensitive data
variable "postgres_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "twilio_auth_token" {
  description = "Twilio authentication token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "s3_secret_key" {
  description = "S3 secret access key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "tranzilla_api_key" {
  description = "Tranzilla API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

# Outputs
output "secrets_manager_arn" {
  description = "ARN of the secrets manager secret"
  value       = aws_secretsmanager_secret.clinic_app_secrets.arn
}

output "ecs_secrets_role_arn" {
  description = "ARN of the ECS secrets role"
  value       = aws_iam_role.ecs_secrets_role.arn
}