# Healthcare Platform Security Operations Runbook

## 🛡️ Overview

This runbook provides comprehensive security operations procedures for the healthcare platform, covering threat detection, incident response, compliance monitoring, and proactive security measures with emphasis on HIPAA requirements and patient data protection.

## 🔍 Security Monitoring Dashboard

### Critical Security Metrics

#### Real-time Security Dashboard
```
URL: /d/security-operations
Refresh: 10s
Panels:
- Failed authentication attempts (last 15 minutes)
- Suspicious IP addresses (geo-blocked countries)
- Rate limiting violations by endpoint
- Unauthorized access attempts timeline
- Active security alerts count
- PHI access patterns anomalies
- Compliance score trending
```

#### Security KPIs
```promql
# Failed authentication rate
rate(auth_failures_total[5m])

# Suspicious activity score
avg_over_time(suspicious_activity_score[15m])

# Unauthorized API access attempts  
rate(http_requests_total{status="401"}[5m])

# PHI access outside business hours
sum(phi_access_total{hour<8 OR hour>18})

# Security policy violations
rate(security_violations_total[5m])
```

## 🚨 Threat Detection and Response

### Automated Threat Detection

#### Suspicious Activity Detection
```bash
#!/bin/bash
# File: /scripts/threat-detection.sh

# Monitor for brute force attacks
FAILED_LOGINS=$(kubectl logs deployment/api-gateway -n clinic-production --since=5m | \
  grep "LOGIN_FAILED" | wc -l)

if [ "$FAILED_LOGINS" -gt 10 ]; then
  echo "ALERT: Potential brute force attack detected - $FAILED_LOGINS failed logins"
  ./scripts/block-suspicious-ips.sh
fi

# Detect SQL injection attempts
SQL_INJECTION=$(kubectl logs deployment/api-gateway -n clinic-production --since=5m | \
  grep -i "union\|select\|drop\|insert\|update\|delete" | wc -l)

if [ "$SQL_INJECTION" -gt 5 ]; then
  echo "ALERT: Potential SQL injection attack detected"
  ./scripts/security-incident-response.sh "sql_injection"
fi

# Monitor for unusual PHI access patterns
UNUSUAL_ACCESS=$(curl -s "http://api-gateway:4000/api/audit/suspicious-activities?days=1" \
  -H "Authorization: Bearer $SECURITY_TOKEN" | jq '.activities | length')

if [ "$UNUSUAL_ACCESS" -gt 5 ]; then
  echo "ALERT: Unusual PHI access patterns detected"
  ./scripts/phi-access-investigation.sh
fi
```

#### IP Reputation Monitoring
```bash
#!/bin/bash
# File: /scripts/ip-reputation-check.sh

# Extract unique IP addresses from logs
kubectl logs deployment/api-gateway -n clinic-production --since=1h | \
  grep -oE '\b([0-9]{1,3}\.){3}[0-9]{1,3}\b' | sort -u > /tmp/active_ips.txt

# Check IPs against threat intelligence feeds
while read ip; do
  # Check against AbuseIPDB
  ABUSE_SCORE=$(curl -s -G https://api.abuseipdb.com/api/v2/check \
    --data-urlencode "ipAddress=$ip" \
    -H "Key: $ABUSEIPDB_API_KEY" \
    -H "Accept: application/json" | jq '.data.abuseConfidencePercentage')
  
  if [ "$ABUSE_SCORE" -gt 50 ]; then
    echo "THREAT: High-risk IP detected: $ip (Score: $ABUSE_SCORE%)"
    ./scripts/block-ip.sh "$ip"
  fi
  
  # Check against VirusTotal
  VT_DETECTIONS=$(curl -s "https://www.virustotal.com/vtapi/v2/ip-address/report" \
    --form "apikey=$VT_API_KEY" \
    --form "ip=$ip" | jq '.detected_urls | length')
  
  if [ "$VT_DETECTIONS" -gt 0 ]; then
    echo "THREAT: Malicious IP detected: $ip (Detections: $VT_DETECTIONS)"
    ./scripts/block-ip.sh "$ip"
  fi
done < /tmp/active_ips.txt
```

### Advanced Threat Detection

#### Behavioral Analysis
```python
#!/usr/bin/env python3
# File: /scripts/behavioral-analysis.py

import json
import requests
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import IsolationForest

def analyze_user_behavior():
    """Detect anomalous user behavior patterns"""
    
    # Fetch user activity data
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=24)
    
    response = requests.get(
        f"http://api-gateway:4000/api/audit/events",
        headers={"Authorization": f"Bearer {os.environ['SECURITY_TOKEN']}"},
        params={
            "startDate": start_time.isoformat(),
            "endDate": end_time.isoformat(),
            "category": "DATA_ACCESS"
        }
    )
    
    events = response.json()['events']
    
    # Extract behavioral features
    user_features = {}
    for event in events:
        user_id = event['userId']
        if user_id not in user_features:
            user_features[user_id] = {
                'access_count': 0,
                'unique_patients': set(),
                'access_hours': [],
                'ip_addresses': set(),
                'failed_attempts': 0
            }
        
        features = user_features[user_id]
        features['access_count'] += 1
        features['unique_patients'].add(event.get('patientId'))
        features['access_hours'].append(datetime.fromisoformat(event['timestamp']).hour)
        features['ip_addresses'].add(event.get('ipAddress'))
        
        if 'FAILED' in event['eventType']:
            features['failed_attempts'] += 1
    
    # Convert to numerical features for anomaly detection
    feature_matrix = []
    user_ids = []
    
    for user_id, features in user_features.items():
        feature_vector = [
            features['access_count'],
            len(features['unique_patients']),
            np.std(features['access_hours']) if len(features['access_hours']) > 1 else 0,
            len(features['ip_addresses']),
            features['failed_attempts']
        ]
        feature_matrix.append(feature_vector)
        user_ids.append(user_id)
    
    # Detect anomalies using Isolation Forest
    if len(feature_matrix) > 10:  # Need sufficient data
        clf = IsolationForest(contamination=0.1, random_state=42)
        anomaly_labels = clf.fit_predict(feature_matrix)
        
        # Report anomalous users
        for i, label in enumerate(anomaly_labels):
            if label == -1:  # Anomaly detected
                user_id = user_ids[i]
                print(f"ANOMALY: Suspicious behavior detected for user {user_id}")
                
                # Create security incident
                incident_data = {
                    "type": "behavioral_anomaly",
                    "user_id": user_id,
                    "features": dict(zip(
                        ['access_count', 'unique_patients', 'hour_variance', 'ip_count', 'failed_attempts'],
                        feature_matrix[i]
                    )),
                    "timestamp": datetime.now().isoformat()
                }
                
                requests.post(
                    "http://api-gateway:4000/api/security/incidents",
                    headers={"Authorization": f"Bearer {os.environ['SECURITY_TOKEN']}"},
                    json=incident_data
                )

if __name__ == "__main__":
    analyze_user_behavior()
```

## 🔐 Access Control and Authentication Security

### Multi-Factor Authentication Monitoring

#### MFA Bypass Detection
```bash
#!/bin/bash
# File: /scripts/mfa-monitoring.sh

# Detect users bypassing MFA
MFA_BYPASSES=$(kubectl logs deployment/auth-service -n clinic-production --since=1h | \
  grep "MFA_BYPASSED\|MFA_SKIPPED" | wc -l)

if [ "$MFA_BYPASSES" -gt 0 ]; then
  echo "ALERT: MFA bypass attempts detected: $MFA_BYPASSES"
  
  # Get details of bypass attempts
  kubectl logs deployment/auth-service -n clinic-production --since=1h | \
    grep "MFA_BYPASSED\|MFA_SKIPPED" | \
    jq -r '.userId + " from " + .ipAddress + " at " + .timestamp'
  
  # Auto-disable affected accounts
  kubectl logs deployment/auth-service -n clinic-production --since=1h | \
    grep "MFA_BYPASSED\|MFA_SKIPPED" | \
    jq -r '.userId' | sort -u | \
    while read user_id; do
      curl -X POST "http://api-gateway:4000/api/admin/users/$user_id/disable" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "X-Security-Action: mfa-bypass-protection"
    done
fi

# Monitor for MFA device registration anomalies
DEVICE_REGISTRATIONS=$(kubectl logs deployment/auth-service -n clinic-production --since=1h | \
  grep "MFA_DEVICE_REGISTERED" | wc -l)

# Alert if unusual number of device registrations
if [ "$DEVICE_REGISTRATIONS" -gt 10 ]; then
  echo "ALERT: Unusual MFA device registration activity: $DEVICE_REGISTRATIONS devices"
fi
```

#### Privileged Account Monitoring
```bash
#!/bin/bash
# File: /scripts/privileged-account-monitoring.sh

# Monitor admin account activities
ADMIN_ACTIVITIES=$(curl -s "http://api-gateway:4000/api/audit/events" \
  -H "Authorization: Bearer $SECURITY_TOKEN" \
  -G -d "userRole=ADMIN" -d "userRole=SUPER_ADMIN" \
  -d "startDate=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | \
  jq '.events | length')

if [ "$ADMIN_ACTIVITIES" -gt 50 ]; then
  echo "ALERT: High admin activity detected: $ADMIN_ACTIVITIES actions in last hour"
fi

# Check for privilege escalation attempts
PRIVILEGE_ESCALATIONS=$(kubectl logs deployment/api-gateway -n clinic-production --since=1h | \
  grep "PRIVILEGE_ESCALATION\|UNAUTHORIZED_ADMIN_ACCESS" | wc -l)

if [ "$PRIVILEGE_ESCALATIONS" -gt 0 ]; then
  echo "CRITICAL: Privilege escalation attempts detected: $PRIVILEGE_ESCALATIONS"
  ./scripts/security-incident-response.sh "privilege_escalation"
fi

# Monitor service account usage
kubectl get serviceaccounts -A -o json | \
  jq -r '.items[] | select(.metadata.name != "default") | .metadata.namespace + "/" + .metadata.name' | \
  while read sa; do
    USAGE=$(kubectl logs -l app=api-gateway -n clinic-production --since=1h | \
      grep "serviceAccount.*$sa" | wc -l)
    
    if [ "$USAGE" -gt 100 ]; then
      echo "ALERT: High service account usage: $sa ($USAGE requests)"
    fi
  done
```

## 📊 HIPAA Compliance Monitoring

### PHI Access Monitoring

#### Unauthorized PHI Access Detection
```bash
#!/bin/bash
# File: /scripts/phi-access-monitoring.sh

# Monitor PHI access outside business hours (8 AM - 6 PM)
CURRENT_HOUR=$(date +%H)
if [ "$CURRENT_HOUR" -lt 8 ] || [ "$CURRENT_HOUR" -gt 18 ]; then
  PHI_ACCESS=$(curl -s "http://api-gateway:4000/api/audit/events" \
    -H "Authorization: Bearer $SECURITY_TOKEN" \
    -G -d "category=DATA_ACCESS" -d "category=CLINICAL" \
    -d "startDate=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | \
    jq '.events | map(select(.patientId != null)) | length')
  
  if [ "$PHI_ACCESS" -gt 5 ]; then
    echo "ALERT: After-hours PHI access detected: $PHI_ACCESS accesses"
    
    # Get details and notify compliance team
    curl -s "http://api-gateway:4000/api/audit/events" \
      -H "Authorization: Bearer $SECURITY_TOKEN" \
      -G -d "category=DATA_ACCESS" -d "category=CLINICAL" \
      -d "startDate=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | \
      jq '.events | map(select(.patientId != null)) | .[] | {userId, patientId, timestamp, ipAddress}' > \
      /tmp/afterhours-phi-access.json
    
    # Send to compliance team
    curl -X POST "$SLACK_WEBHOOK" -d "{
      \"channel\": \"#compliance-alerts\",
      \"text\": \"🚨 After-hours PHI access detected: $PHI_ACCESS accesses\",
      \"attachments\": [{
        \"color\": \"danger\",
        \"title\": \"Review Required\",
        \"text\": \"PHI accessed outside business hours - compliance review needed\"
      }]
    }"
  fi
fi

# Monitor for mass PHI access (potential data exfiltration)
MASS_ACCESS=$(curl -s "http://api-gateway:4000/api/audit/events" \
  -H "Authorization: Bearer $SECURITY_TOKEN" \
  -G -d "category=DATA_ACCESS" \
  -d "startDate=$(date -d '15 minutes ago' -u +%Y-%m-%dT%H:%M:%SZ)" | \
  jq '[.events | group_by(.userId) | .[] | {user: .[0].userId, count: length}] | map(select(.count > 20))')

if [ "$(echo "$MASS_ACCESS" | jq 'length')" -gt 0 ]; then
  echo "CRITICAL: Mass PHI access detected"
  echo "$MASS_ACCESS" | jq -r '.[] | "User " + .user + " accessed " + (.count | tostring) + " patient records"'
  
  # Auto-suspend suspicious users
  echo "$MASS_ACCESS" | jq -r '.[].user' | while read user_id; do
    curl -X POST "http://api-gateway:4000/api/admin/users/$user_id/suspend" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "X-Security-Action: mass-access-protection"
  done
fi
```

#### Compliance Violation Detection
```bash
#!/bin/bash
# File: /scripts/compliance-monitoring.sh

# Check for PHI access without minimum necessary justification
UNJUSTIFIED_ACCESS=$(curl -s "http://api-gateway:4000/api/audit/events" \
  -H "Authorization: Bearer $SECURITY_TOKEN" \
  -G -d "category=DATA_ACCESS" \
  -d "startDate=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | \
  jq '[.events | map(select(.patientId != null and (.hipaaMetadata.minimumNecessary != true or .hipaaMetadata.accessPurpose == null)))] | length')

if [ "$UNJUSTIFIED_ACCESS" -gt 0 ]; then
  echo "COMPLIANCE VIOLATION: $UNJUSTIFIED_ACCESS PHI accesses without proper justification"
fi

# Monitor for missing patient consent
MISSING_CONSENT=$(curl -s "http://api-gateway:4000/api/audit/events" \
  -H "Authorization: Bearer $SECURITY_TOKEN" \
  -G -d "category=DATA_ACCESS" \
  -d "startDate=$(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ)" | \
  jq '[.events | map(select(.patientId != null and .hipaaMetadata.patientConsent != true and .hipaaMetadata.emergencyAccess != true))] | length')

if [ "$MISSING_CONSENT" -gt 0 ]; then
  echo "COMPLIANCE VIOLATION: $MISSING_CONSENT PHI accesses without patient consent"
fi

# Check audit trail integrity
AUDIT_GAPS=$(curl -s "http://api-gateway:4000/api/audit/integrity-check" \
  -H "Authorization: Bearer $SECURITY_TOKEN" | \
  jq '.gaps | length')

if [ "$AUDIT_GAPS" -gt 0 ]; then
  echo "CRITICAL: Audit trail integrity compromised - $AUDIT_GAPS gaps detected"
  ./scripts/security-incident-response.sh "audit_tampering"
fi
```

## 🔧 Security Hardening and Maintenance

### Regular Security Updates

#### Vulnerability Scanning
```bash
#!/bin/bash
# File: /scripts/vulnerability-scan.sh

# Scan container images for vulnerabilities
for image in $(kubectl get pods -n clinic-production -o jsonpath='{.items[*].spec.containers[*].image}' | tr ' ' '\n' | sort -u); do
  echo "Scanning image: $image"
  
  # Use Trivy for vulnerability scanning
  trivy image --exit-code 1 --severity HIGH,CRITICAL "$image"
  
  if [ $? -ne 0 ]; then
    echo "CRITICAL vulnerabilities found in $image"
    
    # Send alert
    curl -X POST "$SLACK_WEBHOOK" -d "{
      \"text\": \"🚨 Critical vulnerabilities found in container image: $image\",
      \"channel\": \"#security-alerts\"
    }"
  fi
done

# Scan infrastructure for misconfigurations
kube-bench run --targets master,node --benchmark cis-1.6 > /tmp/kube-bench-results.txt

FAILED_CHECKS=$(grep -c "FAIL" /tmp/kube-bench-results.txt)
if [ "$FAILED_CHECKS" -gt 0 ]; then
  echo "Security configuration issues found: $FAILED_CHECKS failed checks"
fi

# Network security scan
nmap -sS -sV -O localhost > /tmp/nmap-results.txt
OPEN_PORTS=$(grep -c "open" /tmp/nmap-results.txt)

echo "Open ports detected: $OPEN_PORTS"
```

#### Security Configuration Audit
```bash
#!/bin/bash
# File: /scripts/security-config-audit.sh

echo "Starting security configuration audit..."

# Check for default passwords
DEFAULT_PASSWORDS=$(kubectl get secrets -A -o json | \
  jq -r '.items[] | select(.data.password != null) | .data.password' | \
  base64 -d | grep -c "password\|admin\|123456")

if [ "$DEFAULT_PASSWORDS" -gt 0 ]; then
  echo "WARNING: Potential default passwords found: $DEFAULT_PASSWORDS"
fi

# Verify encryption settings
UNENCRYPTED_SECRETS=$(kubectl get secrets -A -o json | \
  jq -r '.items[] | select(.type != "kubernetes.io/service-account-token") | select(.metadata.annotations["encryption.alpha.kubernetes.io/encrypted"] != "true") | .metadata.name')

if [ -n "$UNENCRYPTED_SECRETS" ]; then
  echo "WARNING: Unencrypted secrets found:"
  echo "$UNENCRYPTED_SECRETS"
fi

# Check network policies
MISSING_NETPOL=$(kubectl get namespaces -o json | \
  jq -r '.items[] | select(.metadata.name != "kube-system" and .metadata.name != "kube-public") | .metadata.name' | \
  while read ns; do
    POLICIES=$(kubectl get networkpolicy -n "$ns" --no-headers | wc -l)
    if [ "$POLICIES" -eq 0 ]; then
      echo "$ns"
    fi
  done)

if [ -n "$MISSING_NETPOL" ]; then
  echo "WARNING: Namespaces without network policies:"
  echo "$MISSING_NETPOL"
fi

# Verify RBAC settings
OVERPRIVILEGED_ACCOUNTS=$(kubectl get clusterrolebindings -o json | \
  jq -r '.items[] | select(.roleRef.name == "cluster-admin") | .subjects[]? | select(.kind == "User" or .kind == "ServiceAccount") | .name')

echo "Cluster admin accounts:"
echo "$OVERPRIVILEGED_ACCOUNTS"
```

### Incident Response Procedures

#### Security Incident Response Script
```bash
#!/bin/bash
# File: /scripts/security-incident-response.sh

INCIDENT_TYPE="$1"
INCIDENT_ID="SEC-$(date +%Y%m%d-%H%M%S)"

echo "Security incident response initiated: $INCIDENT_ID ($INCIDENT_TYPE)"

case "$INCIDENT_TYPE" in
  "brute_force")
    # Block source IPs
    kubectl logs deployment/api-gateway -n clinic-production --since=15m | \
      grep "LOGIN_FAILED" | \
      jq -r '.ipAddress' | sort | uniq -c | sort -nr | \
      awk '$1 > 10 {print $2}' | \
      while read ip; do
        ./scripts/block-ip.sh "$ip"
        echo "Blocked IP: $ip"
      done
    ;;
    
  "sql_injection")
    # Enable enhanced logging and monitoring
    kubectl patch deployment api-gateway -n clinic-production -p \
      '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"SQL_INJECTION_PROTECTION","value":"strict"}]}]}}}}'
    
    # Review recent database queries
    kubectl exec -it deployment/postgres-primary -n clinic-production -- \
      psql -U postgres -d clinic -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 20;"
    ;;
    
  "privilege_escalation")
    # Disable all non-essential admin accounts
    curl -X POST "http://api-gateway:4000/api/admin/emergency/disable-admin-accounts" \
      -H "Authorization: Bearer $SUPER_ADMIN_TOKEN"
    
    # Force re-authentication for all users
    kubectl exec -it deployment/redis-cluster -n clinic-production -- \
      redis-cli --scan --pattern "session:*" | xargs redis-cli DEL
    ;;
    
  "data_breach")
    # Immediate containment
    kubectl patch deployment api-gateway -n clinic-production -p \
      '{"spec":{"template":{"spec":{"containers":[{"name":"api-gateway","env":[{"name":"EMERGENCY_MODE","value":"true"}]}]}}}}'
    
    # Preserve evidence
    kubectl get events -A --sort-by='.lastTimestamp' > "/evidence/k8s-events-$INCIDENT_ID.log"
    kubectl logs --all-containers --prefix -n clinic-production > "/evidence/pod-logs-$INCIDENT_ID.log"
    
    # Notify required parties
    ./scripts/breach-notification.sh "$INCIDENT_ID"
    ;;
esac

# Create incident record
cat > "/incidents/$INCIDENT_ID.json" << EOF
{
  "incident_id": "$INCIDENT_ID",
  "type": "$INCIDENT_TYPE",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "investigating",
  "severity": "high",
  "affected_systems": ["api-gateway", "auth-service"],
  "response_actions": []
}
EOF

# Notify security team
curl -X POST "$SLACK_WEBHOOK" -d "{
  \"channel\": \"#security-incidents\",
  \"text\": \"🚨 Security incident $INCIDENT_ID ($INCIDENT_TYPE) - Response initiated\",
  \"attachments\": [{
    \"color\": \"danger\",
    \"title\": \"Immediate Action Required\",
    \"text\": \"Security incident response procedures activated\"
  }]
}"

echo "Security incident response completed: $INCIDENT_ID"
```

## 📅 Security Operations Schedule

### Daily Security Tasks (Automated)
```bash
# File: /etc/cron.d/security-operations

# Threat detection every 5 minutes
*/5 * * * * root /scripts/threat-detection.sh >> /var/log/security.log 2>&1

# IP reputation check every 30 minutes
*/30 * * * * root /scripts/ip-reputation-check.sh >> /var/log/security.log 2>&1

# MFA monitoring every 15 minutes
*/15 * * * * root /scripts/mfa-monitoring.sh >> /var/log/security.log 2>&1

# PHI access monitoring every 10 minutes
*/10 * * * * root /scripts/phi-access-monitoring.sh >> /var/log/security.log 2>&1

# Compliance monitoring hourly
0 * * * * root /scripts/compliance-monitoring.sh >> /var/log/compliance.log 2>&1

# Privileged account monitoring every 30 minutes
*/30 * * * * root /scripts/privileged-account-monitoring.sh >> /var/log/security.log 2>&1

# Behavioral analysis every 6 hours
0 */6 * * * root /scripts/behavioral-analysis.py >> /var/log/security.log 2>&1
```

### Weekly Security Tasks
```bash
# Sunday 02:00 - Weekly vulnerability scan
0 2 * * 0 root /scripts/vulnerability-scan.sh >> /var/log/security-weekly.log 2>&1

# Wednesday 01:00 - Security configuration audit
0 1 * * 3 root /scripts/security-config-audit.sh >> /var/log/security-weekly.log 2>&1

# Friday 23:00 - Security metrics review
0 23 * * 5 root /scripts/security-metrics-review.sh >> /var/log/security-weekly.log 2>&1
```

### Monthly Security Tasks
```bash
# First Sunday 03:00 - Comprehensive security assessment
0 3 1-7 * 0 root /scripts/comprehensive-security-assessment.sh >> /var/log/security-monthly.log 2>&1

# Third Wednesday 02:00 - Penetration testing
0 2 15-21 * 3 root /scripts/automated-pentest.sh >> /var/log/security-monthly.log 2>&1
```

## 📊 Security Metrics and Reporting

### Security Dashboard Metrics
```yaml
security_metrics:
  authentication:
    - failed_login_rate
    - mfa_bypass_attempts
    - account_lockout_rate
    - password_reset_frequency
    
  access_control:
    - unauthorized_access_attempts
    - privilege_escalation_attempts
    - admin_activity_volume
    - service_account_usage
    
  data_protection:
    - phi_access_volume
    - after_hours_access
    - mass_data_access_events
    - data_export_requests
    
  compliance:
    - hipaa_violation_count
    - audit_trail_integrity
    - consent_compliance_rate
    - minimum_necessary_compliance
    
  threat_detection:
    - suspicious_ip_blocks
    - malware_detections
    - vulnerability_count
    - security_incident_rate
```

### Weekly Security Report Generation
```bash
#!/bin/bash
# File: /scripts/weekly-security-report.sh

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="/reports/security-report-$REPORT_DATE.json"

# Collect security metrics
FAILED_LOGINS=$(curl -s "http://prometheus:9090/api/v1/query?query=sum(increase(auth_failures_total[7d]))" | jq '.data.result[0].value[1] | tonumber')
BLOCKED_IPS=$(wc -l < /etc/blocked-ips.txt)
SECURITY_INCIDENTS=$(find /incidents -name "SEC-*.json" -mtime -7 | wc -l)
PHI_ACCESSES=$(curl -s "http://api-gateway:4000/api/audit/statistics" -H "Authorization: Bearer $SECURITY_TOKEN" -G -d "startDate=$(date -d '7 days ago' +%Y-%m-%d)" -d "endDate=$(date +%Y-%m-%d)" | jq '.patientAccessEvents')

# Generate report
cat > "$REPORT_FILE" << EOF
{
  "report_date": "$REPORT_DATE",
  "period": "weekly",
  "security_summary": {
    "failed_logins": $FAILED_LOGINS,
    "blocked_ips": $BLOCKED_IPS,
    "security_incidents": $SECURITY_INCIDENTS,
    "phi_accesses": $PHI_ACCESSES,
    "compliance_score": $(curl -s "http://api-gateway:4000/api/compliance/score" -H "Authorization: Bearer $SECURITY_TOKEN" | jq '.score')
  },
  "recommendations": [
    "Continue monitoring failed authentication patterns",
    "Review blocked IP addresses for false positives",
    "Conduct security awareness training if incidents > 5"
  ]
}
EOF

# Send report to security team
curl -X POST "$SLACK_WEBHOOK" -d "{
  \"channel\": \"#security-reports\",
  \"text\": \"📊 Weekly Security Report - $REPORT_DATE\",
  \"attachments\": [{
    \"color\": \"good\",
    \"title\": \"Security Metrics Summary\",
    \"fields\": [
      {\"title\": \"Failed Logins\", \"value\": \"$FAILED_LOGINS\", \"short\": true},
      {\"title\": \"Blocked IPs\", \"value\": \"$BLOCKED_IPS\", \"short\": true},
      {\"title\": \"Security Incidents\", \"value\": \"$SECURITY_INCIDENTS\", \"short\": true},
      {\"title\": \"PHI Accesses\", \"value\": \"$PHI_ACCESSES\", \"short\": true}
    ]
  }]
}"

echo "Weekly security report generated: $REPORT_FILE"
```

This comprehensive security operations runbook ensures proactive threat detection, rapid incident response, and continuous compliance monitoring for the healthcare platform while maintaining the highest standards of patient data protection.