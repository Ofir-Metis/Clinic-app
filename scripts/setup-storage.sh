#!/bin/bash
# MinIO Storage Setup Script
# Creates buckets and configures policies for recording storage

set -e

echo "🗄️  Setting up MinIO storage for clinic recordings..."

# MinIO configuration
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="minio"
MINIO_SECRET_KEY="minio123"

# Bucket names
RECORDINGS_BUCKET="clinic-recordings"
TRANSCRIPTS_BUCKET="clinic-transcripts"
SUMMARIES_BUCKET="clinic-summaries"
THUMBNAILS_BUCKET="clinic-thumbnails"

# Check if MinIO is running
echo "📡 Checking MinIO connection..."
if ! curl -f $MINIO_ENDPOINT/minio/health/live > /dev/null 2>&1; then
    echo "❌ MinIO is not running. Please start it first:"
    echo "   docker compose up minio -d"
    exit 1
fi

echo "✅ MinIO is running"

# Install MinIO client if not available
if ! command -v mc &> /dev/null; then
    echo "📦 Installing MinIO client..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl https://dl.min.io/client/mc/release/linux-amd64/mc \
          --create-dirs \
          -o $HOME/minio-binaries/mc
        chmod +x $HOME/minio-binaries/mc
        export PATH=$PATH:$HOME/minio-binaries/
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install minio/stable/mc
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        echo "Please install MinIO client manually from https://dl.min.io/client/mc/release/windows-amd64/mc.exe"
        exit 1
    fi
fi

# Configure MinIO client
echo "🔧 Configuring MinIO client..."
mc alias set local $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Create buckets
echo "📁 Creating storage buckets..."
for bucket in $RECORDINGS_BUCKET $TRANSCRIPTS_BUCKET $SUMMARIES_BUCKET $THUMBNAILS_BUCKET; do
    if mc ls local/$bucket > /dev/null 2>&1; then
        echo "✅ Bucket $bucket already exists"
    else
        echo "📂 Creating bucket: $bucket"
        mc mb local/$bucket
        echo "✅ Created bucket: $bucket"
    fi
done

# Set up bucket policies for web access
echo "🔐 Setting up bucket policies..."

# Create a temporary policy file for recordings
cat > /tmp/recordings-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "*"},
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::$RECORDINGS_BUCKET"
    },
    {
      "Effect": "Allow",
      "Principal": {"AWS": "*"},
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::$RECORDINGS_BUCKET/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
EOF

# Apply bucket policy (this might not work with MinIO, but we'll try)
echo "📋 Applying bucket policies..."
mc policy set-json /tmp/recordings-policy.json local/$RECORDINGS_BUCKET || echo "⚠️  Policy not applied (MinIO may not support custom policies)"

# Set up CORS for frontend access
echo "🌐 Setting up CORS for web uploads..."
cat > /tmp/cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173", "http://localhost:4000"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"]
    }
  ]
}
EOF

# Apply CORS (may not work with all MinIO versions)
for bucket in $RECORDINGS_BUCKET $TRANSCRIPTS_BUCKET $SUMMARIES_BUCKET; do
    echo "🔗 Setting CORS for $bucket..."
    mc cors set /tmp/cors-config.json local/$bucket || echo "⚠️  CORS not set (feature may not be available)"
done

# Test bucket access
echo "🧪 Testing bucket access..."
echo "test-file-$(date +%s)" | mc pipe local/$RECORDINGS_BUCKET/test.txt
mc ls local/$RECORDINGS_BUCKET/test.txt
mc rm local/$RECORDINGS_BUCKET/test.txt
echo "✅ Bucket access test successful"

# Clean up temporary files
rm -f /tmp/recordings-policy.json /tmp/cors-config.json

echo ""
echo "🎉 MinIO storage setup complete!"
echo ""
echo "📊 Storage Configuration:"
echo "   Endpoint: $MINIO_ENDPOINT"
echo "   Access Key: $MINIO_ACCESS_KEY"
echo "   Buckets created:"
echo "     • $RECORDINGS_BUCKET (for video/audio recordings)"
echo "     • $TRANSCRIPTS_BUCKET (for AI-generated transcripts)"
echo "     • $SUMMARIES_BUCKET (for session summaries)"
echo "     • $THUMBNAILS_BUCKET (for video thumbnails)"
echo ""
echo "🚀 Your recording storage system is ready!"
echo "   You can now upload recordings through the API at:"
echo "   POST http://localhost:4000/api/recordings/upload"
echo ""
echo "🔍 Monitor storage usage:"
echo "   mc ls --recursive local/$RECORDINGS_BUCKET"
echo "   mc du --depth=1 local/$RECORDINGS_BUCKET"
echo ""
echo "💡 Pro tip: Use the API health check to verify everything is working:"
echo "   curl http://localhost:4000/api/recordings/admin/health"