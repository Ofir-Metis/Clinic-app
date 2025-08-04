#!/bin/bash
# Setup script for secrets management in production

set -e

echo "🔐 Setting up secrets management for Clinic App..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

# Check if we're logged into AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ Not authenticated with AWS. Please run 'aws configure' first."
    exit 1
fi

ENVIRONMENT=${1:-staging}
REGION=${AWS_REGION:-us-east-1}
SECRET_NAME="clinic-app-secrets-${ENVIRONMENT}"

echo "📍 Environment: ${ENVIRONMENT}"
echo "📍 Region: ${REGION}"
echo "📍 Secret Name: ${SECRET_NAME}"

# Check if secret already exists
if aws secretsmanager describe-secret --secret-id "${SECRET_NAME}" --region "${REGION}" &> /dev/null; then
    echo "✅ Secret ${SECRET_NAME} already exists"
else
    echo "🆕 Creating new secret ${SECRET_NAME}..."
    
    # Create the secret with placeholder values
    aws secretsmanager create-secret \
        --name "${SECRET_NAME}" \
        --description "Secrets for Clinic App ${ENVIRONMENT} environment" \
        --secret-string '{
            "POSTGRES_PASSWORD": "CHANGE_ME",
            "JWT_SECRET": "CHANGE_ME", 
            "OPENAI_API_KEY": "CHANGE_ME",
            "TWILIO_AUTH_TOKEN": "CHANGE_ME",
            "S3_SECRET_KEY": "CHANGE_ME",
            "STRIPE_SECRET_KEY": "CHANGE_ME",
            "TRANZILLA_API_KEY": "CHANGE_ME",
            "GOOGLE_CLIENT_SECRET": "CHANGE_ME"
        }' \
        --region "${REGION}" \
        --tags '[
            {"Key": "Environment", "Value": "'${ENVIRONMENT}'"},
            {"Key": "Application", "Value": "clinic-app"},
            {"Key": "ManagedBy", "Value": "script"}
        ]'
        
    echo "✅ Secret created successfully!"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Update secret values in AWS Secrets Manager console:"
echo "   https://console.aws.amazon.com/secretsmanager/home?region=${REGION}#!/secret?name=${SECRET_NAME}"
echo ""
echo "2. Set environment variables for your application:"
echo "   export AWS_REGION=${REGION}"
echo "   export AWS_SECRET_NAME=${SECRET_NAME}"
echo "   export SECRETS_PROVIDER=aws"
echo "   export NODE_ENV=production"
echo ""
echo "3. Ensure your application has IAM permissions to read the secret"
echo ""
echo "🎉 Secrets management setup complete!"