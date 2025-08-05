# Healthcare Platform Deployment Runbook

## 🚀 Overview

This runbook provides step-by-step procedures for deploying the healthcare platform to production environments with HIPAA compliance and high availability requirements.

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] Kubernetes cluster (v1.24+) with RBAC enabled
- [ ] PostgreSQL 15+ with replication configured
- [ ] Redis 7+ cluster for caching and sessions
- [ ] NATS messaging broker for microservices communication
- [ ] MinIO/S3 storage for file uploads and recordings
- [ ] Load balancer (NGINX/HAProxy) configured
- [ ] SSL certificates installed and validated
- [ ] DNS records configured and propagated

### Security Requirements
- [ ] Network security groups/firewalls configured
- [ ] VPC/subnet isolation implemented
- [ ] Secrets management (AWS Secrets Manager/Azure Key Vault) configured
- [ ] Database encryption at rest enabled
- [ ] Backup encryption configured
- [ ] Audit logging enabled
- [ ] Monitoring and alerting systems operational

### Compliance Requirements
- [ ] HIPAA compliance assessment completed
- [ ] Data retention policies configured
- [ ] Audit trail system operational
- [ ] Incident response procedures documented
- [ ] Business Associate Agreements (BAAs) in place
- [ ] Staff training completed

## 🔧 Deployment Procedures

### Step 1: Environment Preparation

```bash
# 1. Set environment variables
export ENVIRONMENT=production
export NAMESPACE=clinic-production
export REGISTRY=your-registry.com
export VERSION=$(git rev-parse --short HEAD)

# 2. Verify cluster connectivity
kubectl cluster-info
kubectl get nodes

# 3. Create namespace and labels
kubectl create namespace $NAMESPACE
kubectl label namespace $NAMESPACE environment=$ENVIRONMENT
kubectl label namespace $NAMESPACE compliance=hipaa
```

### Step 2: Secrets Management

```bash
# 1. Create database secrets
kubectl create secret generic postgres-credentials \
  --from-literal=username=$POSTGRES_USER \
  --from-literal=password=$POSTGRES_PASSWORD \
  --from-literal=database=$POSTGRES_DB \
  -n $NAMESPACE

# 2. Create JWT secrets
kubectl create secret generic jwt-secrets \
  --from-literal=secret=$JWT_SECRET \
  --from-literal=refresh-secret=$JWT_REFRESH_SECRET \
  -n $NAMESPACE

# 3. Create API keys
kubectl create secret generic external-apis \
  --from-literal=openai-key=$OPENAI_API_KEY \
  --from-literal=twilio-sid=$TWILIO_ACCOUNT_SID \
  --from-literal=twilio-token=$TWILIO_AUTH_TOKEN \
  -n $NAMESPACE

# 4. Create SSL certificates
kubectl create secret tls clinic-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n $NAMESPACE
```

### Step 3: Database Deployment

```bash
# 1. Deploy PostgreSQL primary
kubectl apply -f infrastructure/kubernetes/databases/postgres-primary.yaml -n $NAMESPACE

# 2. Wait for primary to be ready
kubectl wait --for=condition=ready pod -l app=postgres-primary -n $NAMESPACE --timeout=300s

# 3. Run database migrations
kubectl exec -it deployment/postgres-primary -n $NAMESPACE -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -f /migrations/001-initial-schema.sql

# 4. Deploy PostgreSQL replica
kubectl apply -f infrastructure/kubernetes/databases/postgres-replica.yaml -n $NAMESPACE

# 5. Verify replication
kubectl exec -it deployment/postgres-primary -n $NAMESPACE -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT * FROM pg_stat_replication;"
```

### Step 4: Supporting Services

```bash
# 1. Deploy Redis cluster
kubectl apply -f infrastructure/kubernetes/redis/ -n $NAMESPACE

# 2. Deploy NATS messaging
kubectl apply -f infrastructure/kubernetes/nats/ -n $NAMESPACE

# 3. Deploy MinIO storage
kubectl apply -f infrastructure/kubernetes/storage/ -n $NAMESPACE

# 4. Verify services are running
kubectl get pods -n $NAMESPACE
kubectl get svc -n $NAMESPACE
```

### Step 5: Application Services

```bash
# 1. Build and push Docker images
./scripts/build-and-push.sh $VERSION

# 2. Deploy services in dependency order
kubectl apply -f services/auth-service/k8s/ -n $NAMESPACE
kubectl apply -f services/files-service/k8s/ -n $NAMESPACE
kubectl apply -f services/appointments-service/k8s/ -n $NAMESPACE
kubectl apply -f services/notes-service/k8s/ -n $NAMESPACE
kubectl apply -f services/notifications-service/k8s/ -n $NAMESPACE
kubectl apply -f services/ai-service/k8s/ -n $NAMESPACE
kubectl apply -f services/analytics-service/k8s/ -n $NAMESPACE
kubectl apply -f services/settings-service/k8s/ -n $NAMESPACE
kubectl apply -f services/billing-service/k8s/ -n $NAMESPACE
kubectl apply -f services/api-gateway/k8s/ -n $NAMESPACE

# 3. Deploy frontend
kubectl apply -f frontend/k8s/ -n $NAMESPACE

# 4. Wait for all deployments
kubectl wait --for=condition=available deployment --all -n $NAMESPACE --timeout=600s
```

### Step 6: Networking and Ingress

```bash
# 1. Deploy load balancer configuration
kubectl apply -f infrastructure/kubernetes/ingress/ -n $NAMESPACE

# 2. Deploy service mesh (if using Istio)
kubectl apply -f infrastructure/kubernetes/service-mesh/ -n $NAMESPACE

# 3. Configure network policies
kubectl apply -f infrastructure/kubernetes/network-policies/ -n $NAMESPACE

# 4. Verify ingress
kubectl get ingress -n $NAMESPACE
kubectl describe ingress clinic-ingress -n $NAMESPACE
```

### Step 7: Monitoring and Observability

```bash
# 1. Deploy monitoring stack
kubectl apply -f monitoring/kubernetes/ -n $NAMESPACE

# 2. Deploy audit trail monitoring
kubectl apply -f infrastructure/monitoring/ -n $NAMESPACE

# 3. Configure alerting rules
kubectl apply -f monitoring/alerts/ -n $NAMESPACE

# 4. Verify monitoring endpoints
kubectl get servicemonitor -n $NAMESPACE
kubectl get prometheusrule -n $NAMESPACE
```

## ✅ Post-Deployment Verification

### Health Checks

```bash
# 1. Verify all pods are running
kubectl get pods -n $NAMESPACE --field-selector=status.phase!=Running

# 2. Check service endpoints
kubectl get endpoints -n $NAMESPACE

# 3. Test external connectivity
curl -k https://your-domain.com/health
curl -k https://your-domain.com/api/health

# 4. Verify database connectivity
kubectl exec -it deployment/api-gateway -n $NAMESPACE -- \
  node -e "require('./dist/scripts/test-db-connection.js')"
```

### Functional Tests

```bash
# 1. Run smoke tests
npm run test:smoke

# 2. Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# 3. Test file upload
curl -X POST https://your-domain.com/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-file.pdf"

# 4. Test WebSocket connections
wscat -c wss://your-domain.com/socket.io/?transport=websocket
```

### Security Verification

```bash
# 1. SSL certificate validation
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# 2. Security headers check
curl -I https://your-domain.com

# 3. Network policies test
kubectl exec -it test-pod -n $NAMESPACE -- nc -zv postgres-service 5432

# 4. Audit trail verification
kubectl logs deployment/api-gateway -n $NAMESPACE | grep "AUDIT EVENT"
```

## 🔄 Rollback Procedures

### Application Rollback

```bash
# 1. Identify previous version
kubectl rollout history deployment/api-gateway -n $NAMESPACE

# 2. Rollback to previous version
kubectl rollout undo deployment/api-gateway -n $NAMESPACE

# 3. Wait for rollback completion
kubectl rollout status deployment/api-gateway -n $NAMESPACE

# 4. Verify rollback success
kubectl get pods -n $NAMESPACE -l app=api-gateway
```

### Database Rollback

```bash
# 1. Stop application services
kubectl scale deployment --replicas=0 -l tier=backend -n $NAMESPACE

# 2. Restore database backup
kubectl exec -it deployment/postgres-primary -n $NAMESPACE -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB < /backups/backup-$(date -d yesterday +%Y%m%d).sql

# 3. Verify data integrity
kubectl exec -it deployment/postgres-primary -n $NAMESPACE -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM users;"

# 4. Restart application services
kubectl scale deployment --replicas=3 -l tier=backend -n $NAMESPACE
```

## 🚨 Emergency Procedures

### Complete System Outage

```bash
# 1. Activate disaster recovery site
./scripts/activate-dr-site.sh

# 2. Redirect DNS to DR site
# Update DNS records to point to DR environment

# 3. Notify stakeholders
./scripts/send-outage-notification.sh "Primary site down - DR activated"

# 4. Begin recovery procedures
# Follow disaster recovery runbook
```

### Database Emergency Recovery

```bash
# 1. Stop all write operations
kubectl patch deployment api-gateway -n $NAMESPACE -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"READ_ONLY_MODE","value":"true"}]}]}}}}'

# 2. Assess database damage
kubectl exec -it deployment/postgres-primary -n $NAMESPACE -- \
  psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT pg_is_in_recovery();"

# 3. Initiate point-in-time recovery
# Follow database recovery procedures

# 4. Validate data integrity
./scripts/validate-data-integrity.sh
```

## 📊 Deployment Metrics

### Success Criteria
- [ ] All pods in Running state (100%)
- [ ] All health checks passing
- [ ] Response time < 500ms for API endpoints
- [ ] Database replication lag < 5 seconds
- [ ] SSL certificate valid and properly configured
- [ ] All monitoring alerts cleared
- [ ] Audit trail logging operational
- [ ] File upload/download functional
- [ ] Authentication system operational

### Performance Targets
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 100ms (95th percentile)
- **File Upload Time**: < 30 seconds for 50MB files
- **Page Load Time**: < 2 seconds
- **WebSocket Connection**: < 500ms establishment time

## 📝 Deployment Log Template

```
Deployment Date: ___________
Deployed By: ___________
Version: ___________
Environment: ___________

Pre-deployment Checklist:
□ Infrastructure verified
□ Secrets configured
□ Backups completed
□ Stakeholders notified

Deployment Steps:
□ Database deployed and migrated
□ Services deployed in order
□ Networking configured
□ Monitoring enabled

Post-deployment Verification:
□ Health checks passed
□ Functional tests passed
□ Security verification completed
□ Performance targets met

Notes:
_________________________________
_________________________________

Approval: ___________
```

## 🔗 Related Documents

- [Monitoring Runbook](./02-monitoring-runbook.md)
- [Incident Response Runbook](./03-incident-response-runbook.md)
- [Backup and Recovery Runbook](./04-backup-recovery-runbook.md)
- [Security Operations Runbook](./05-security-operations-runbook.md)
- [Maintenance Procedures](./06-maintenance-runbook.md)