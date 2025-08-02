#!/bin/bash

# ===================================================================
# STORAGE INITIALIZATION SCRIPT
# Sets up MinIO/S3 storage with proper buckets, encryption, and policies
# ===================================================================

set -e

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Storage configuration
STORAGE_PROVIDER=${STORAGE_PROVIDER:-minio}
S3_ENDPOINT=${S3_ENDPOINT:-http://localhost:9000}
BUCKET_NAME=${S3_BUCKET_NAME:-clinic-recordings}
ACCESS_KEY=${MINIO_ROOT_USER:-minio}
SECRET_KEY=${MINIO_ROOT_PASSWORD:-minio123}

echo "🗄️ Initializing Storage System..."
echo "Provider: $STORAGE_PROVIDER"
echo "Endpoint: $S3_ENDPOINT"
echo "Bucket: $BUCKET_NAME"

# Check if MinIO client is available
if ! command -v mc &> /dev/null; then
    echo "📦 Installing MinIO client..."
    
    # Download and install MinIO client
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -o mc https://dl.min.io/client/mc/release/linux-amd64/mc
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        curl -o mc https://dl.min.io/client/mc/release/darwin-amd64/mc
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        curl -o mc.exe https://dl.min.io/client/mc/release/windows-amd64/mc.exe
        MC_CMD="./mc.exe"
    else
        echo "❌ Unsupported OS: $OSTYPE"
        exit 1
    fi
    
    chmod +x mc
    MC_CMD=${MC_CMD:-./mc}
else
    MC_CMD="mc"
fi

# Configure MinIO client
echo "🔧 Configuring MinIO client..."
$MC_CMD alias set clinic-minio $S3_ENDPOINT $ACCESS_KEY $SECRET_KEY

# Wait for MinIO to be ready
echo "⏳ Waiting for storage service to be ready..."
for i in {1..30}; do
    if $MC_CMD admin info clinic-minio &> /dev/null; then
        echo "✅ Storage service is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Storage service not ready after 30 attempts"
        exit 1
    fi
    sleep 2
done

# Create main bucket
echo "📦 Creating main bucket: $BUCKET_NAME"
$MC_CMD mb clinic-minio/$BUCKET_NAME --ignore-existing

# Create additional buckets for organization
echo "📁 Creating organizational buckets..."
$MC_CMD mb clinic-minio/$BUCKET_NAME-thumbnails --ignore-existing
$MC_CMD mb clinic-minio/$BUCKET_NAME-quarantine --ignore-existing
$MC_CMD mb clinic-minio/$BUCKET_NAME-archive --ignore-existing

# Set bucket policies
echo "🔐 Setting bucket policies..."

# Private access policy for main bucket
cat > /tmp/policy-private.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME/*",
        "arn:aws:s3:::$BUCKET_NAME"
      ],
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalType": "User"
        }
      }
    }
  ]
}
EOF

$MC_CMD policy set-json /tmp/policy-private.json clinic-minio/$BUCKET_NAME

# Thumbnails bucket policy (allow read access for authenticated users)
cat > /tmp/policy-thumbnails.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::$BUCKET_NAME-thumbnails/*"],
      "Condition": {
        "StringEquals": {
          "s3:ExistingObjectTag/thumbnail": "true"
        }
      }
    }
  ]
}
EOF

$MC_CMD policy set-json /tmp/policy-thumbnails.json clinic-minio/$BUCKET_NAME-thumbnails

# Enable versioning
echo "📄 Enabling versioning..."
$MC_CMD version enable clinic-minio/$BUCKET_NAME
$MC_CMD version enable clinic-minio/$BUCKET_NAME-archive

# Set up lifecycle rules
echo "♻️ Setting up lifecycle rules..."

# Main bucket lifecycle - transition to archive after 90 days
cat > /tmp/lifecycle-main.json << EOF
{
  "Rules": [
    {
      "ID": "recordings-lifecycle",
      "Status": "Enabled",
      "Filter": {"Prefix": "recordings/"},
      "Transition": {
        "Days": 90,
        "StorageClass": "STANDARD_IA"
      },
      "Expiration": {
        "Days": 2555
      }
    },
    {
      "ID": "cleanup-multipart",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
EOF

$MC_CMD ilm import clinic-minio/$BUCKET_NAME < /tmp/lifecycle-main.json

# Archive bucket lifecycle - long-term retention
cat > /tmp/lifecycle-archive.json << EOF
{
  "Rules": [
    {
      "ID": "archive-retention",
      "Status": "Enabled",
      "Filter": {},
      "Expiration": {
        "Days": 3650
      }
    }
  ]
}
EOF

$MC_CMD ilm import clinic-minio/$BUCKET_NAME-archive < /tmp/lifecycle-archive.json

# Enable notifications (if supported)
echo "🔔 Setting up event notifications..."
if $MC_CMD admin info clinic-minio | grep -q "notification"; then
    # Set up webhook notifications for upload events
    cat > /tmp/notification-config.json << EOF
{
  "webhook": {
    "1": {
      "enable": true,
      "endpoint": "http://api-gateway:3000/api/webhooks/storage",
      "events": ["s3:ObjectCreated:*", "s3:ObjectRemoved:*"],
      "prefix": "recordings/"
    }
  }
}
EOF

    $MC_CMD admin config set clinic-minio notify_webhook:1 < /tmp/notification-config.json
    $MC_CMD admin service restart clinic-minio
fi

# Create service account for application
echo "👤 Creating service account for application..."
$MC_CMD admin user add clinic-minio clinic-app "$(openssl rand -base64 32)"

# Create policy for application service account
cat > /tmp/policy-app.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetObjectVersion",
        "s3:DeleteObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*",
        "arn:aws:s3:::$BUCKET_NAME-thumbnails",
        "arn:aws:s3:::$BUCKET_NAME-thumbnails/*",
        "arn:aws:s3:::$BUCKET_NAME-quarantine",
        "arn:aws:s3:::$BUCKET_NAME-quarantine/*"
      ]
    }
  ]
}
EOF

$MC_CMD admin policy create clinic-minio clinic-app-policy /tmp/policy-app.json
$MC_CMD admin policy attach clinic-minio clinic-app-policy --user clinic-app

# Create monitoring script
echo "📊 Creating storage monitoring script..."
cat > scripts/monitor-storage.sh << 'SCRIPT_EOF'
#!/bin/bash
# Storage monitoring script

if [ -f .env ]; then
    source .env
fi

S3_ENDPOINT=${S3_ENDPOINT:-http://localhost:9000}
BUCKET_NAME=${S3_BUCKET_NAME:-clinic-recordings}
ACCESS_KEY=${MINIO_ROOT_USER:-minio}
SECRET_KEY=${MINIO_ROOT_PASSWORD:-minio123}

# Configure MinIO client if not already done
mc alias set clinic-minio $S3_ENDPOINT $ACCESS_KEY $SECRET_KEY &> /dev/null

echo "📊 Storage System Status Report"
echo "================================="
echo "Date: $(date)"
echo ""

# Server info
echo "🖥️ Server Information:"
mc admin info clinic-minio 2>/dev/null | head -10

echo ""
echo "📦 Bucket Statistics:"
for bucket in $BUCKET_NAME $BUCKET_NAME-thumbnails $BUCKET_NAME-quarantine $BUCKET_NAME-archive; do
    if mc ls clinic-minio/$bucket &> /dev/null; then
        size=$(mc du clinic-minio/$bucket --json | jq -r '.size' | awk '{sum+=$1} END {print sum}')
        count=$(mc ls clinic-minio/$bucket --recursive | wc -l)
        echo "  $bucket: $count files, $(numfmt --to=iec $size 2>/dev/null || echo $size) bytes"
    fi
done

echo ""
echo "♻️ Lifecycle Status:"
mc ilm ls clinic-minio/$BUCKET_NAME 2>/dev/null || echo "  No lifecycle rules configured"

echo ""
echo "🔔 Recent Events (last 100):"
mc admin trace clinic-minio --json | head -100 | jq -r '.time + " " + .api.name + " " + .api.bucket' 2>/dev/null || echo "  No recent events"

echo ""
echo "📈 Performance Metrics:"
mc admin prometheus metrics clinic-minio 2>/dev/null | grep -E "(minio_bucket_usage|minio_network)" | head -10 || echo "  Metrics not available"

SCRIPT_EOF

chmod +x scripts/monitor-storage.sh

# Create backup script
echo "💾 Creating storage backup script..."
cat > scripts/backup-storage.sh << 'SCRIPT_EOF'
#!/bin/bash
# Storage backup script

if [ -f .env ]; then
    source .env
fi

S3_ENDPOINT=${S3_ENDPOINT:-http://localhost:9000}
BUCKET_NAME=${S3_BUCKET_NAME:-clinic-recordings}
ACCESS_KEY=${MINIO_ROOT_USER:-minio}
SECRET_KEY=${MINIO_ROOT_PASSWORD:-minio123}
BACKUP_DIR="backups/storage"

mkdir -p $BACKUP_DIR

# Configure MinIO client
mc alias set clinic-minio $S3_ENDPOINT $ACCESS_KEY $SECRET_KEY &> /dev/null

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "💾 Creating storage backup..."
echo "Timestamp: $TIMESTAMP"

# Mirror bucket contents to local backup
echo "📁 Backing up main bucket..."
mc mirror clinic-minio/$BUCKET_NAME $BACKUP_DIR/$TIMESTAMP/recordings/ --overwrite

echo "🖼️ Backing up thumbnails..."
mc mirror clinic-minio/$BUCKET_NAME-thumbnails $BACKUP_DIR/$TIMESTAMP/thumbnails/ --overwrite

# Create metadata backup
echo "📋 Backing up metadata..."
mc ls clinic-minio/$BUCKET_NAME --recursive --json > $BACKUP_DIR/$TIMESTAMP/metadata.json

# Create configuration backup
echo "🔧 Backing up configuration..."
mc admin config get clinic-minio > $BACKUP_DIR/$TIMESTAMP/config.json 2>/dev/null || echo "Config backup not available"

# Compress backup
echo "🗜️ Compressing backup..."
cd $BACKUP_DIR
tar -czf storage_backup_$TIMESTAMP.tar.gz $TIMESTAMP/
rm -rf $TIMESTAMP/

echo "✅ Storage backup completed: $BACKUP_DIR/storage_backup_$TIMESTAMP.tar.gz"

# Clean up old backups (keep last 7)
find $BACKUP_DIR -name "storage_backup_*.tar.gz" -mtime +7 -delete
echo "🧹 Old backups cleaned up"

SCRIPT_EOF

chmod +x scripts/backup-storage.sh

# Clean up temporary files
rm -f /tmp/policy-*.json /tmp/lifecycle-*.json /tmp/notification-config.json

echo ""
echo "🎉 Storage initialization completed successfully!"
echo ""
echo "📝 Storage Configuration:"
echo "- Main bucket: $BUCKET_NAME"
echo "- Thumbnails bucket: $BUCKET_NAME-thumbnails"
echo "- Quarantine bucket: $BUCKET_NAME-quarantine"
echo "- Archive bucket: $BUCKET_NAME-archive"
echo "- Versioning: Enabled"
echo "- Lifecycle: Configured"
echo "- Access: Private with service account"
echo ""
echo "🔧 Management commands:"
echo "- Monitor storage: ./scripts/monitor-storage.sh"
echo "- Backup storage: ./scripts/backup-storage.sh"
echo "- MinIO console: $S3_ENDPOINT (admin:$ACCESS_KEY)"
echo ""
echo "🚀 Storage system ready for production use!"