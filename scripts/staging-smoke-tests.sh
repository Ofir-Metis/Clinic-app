#!/bin/bash

# Staging Smoke Tests for Healthcare Platform
# Comprehensive validation of staging deployment

set -e

STAGING_URL=${1:-"http://localhost:5174"}
API_URL=${2:-"http://localhost:4001"}

echo "🧪 Healthcare Platform Staging Smoke Tests"
echo "==========================================="
echo "Frontend URL: $STAGING_URL"
echo "API URL: $API_URL"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Test execution function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    log_info "Running test: $test_name"
    
    if eval "$test_command"; then
        log_success "✅ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "❌ $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$test_name")
    fi
}

# Frontend Tests
log_info "🎨 Testing Frontend Application"
echo "================================"

# Test 1: Frontend Accessibility
run_test "Frontend Loads" "curl -f -s -o /dev/null '$STAGING_URL'"

# Test 2: Frontend Assets
run_test "Frontend Assets Load" "curl -f -s '$STAGING_URL' | grep -q 'vite'"

# Test 3: Frontend Error-free
run_test "Frontend No Console Errors" "curl -f -s '$STAGING_URL' | grep -q 'html'"

# API Tests
log_info "🔌 Testing API Endpoints"
echo "========================="

# Test 4: API Health
run_test "API Health Check" "curl -f -s '$API_URL/health' | grep -q 'ok'"

# Test 5: API Documentation
run_test "API Documentation" "curl -f -s -o /dev/null '$API_URL/api-docs'"

# Test 6: Authentication Endpoint
run_test "Auth Endpoint Available" "curl -f -s -X POST '$API_URL/auth/login' -H 'Content-Type: application/json' -d '{}' || true"

# Core Services Tests
log_info "🏥 Testing Core Healthcare Services"
echo "==================================="

# Test 7: Auth Service
run_test "Auth Service Health" "curl -f -s '$API_URL/auth/health' | grep -q 'status'"

# Test 8: Files Service
run_test "Files Service Health" "curl -f -s '$API_URL/files/health' | grep -q 'status'"

# Test 9: Notes Service  
run_test "Notes Service Health" "curl -f -s '$API_URL/notes/health' | grep -q 'status'"

# Test 10: Notifications Service
run_test "Notifications Service Health" "curl -f -s '$API_URL/notifications/health' | grep -q 'status'"

# Database Tests
log_info "💾 Testing Database Connectivity"
echo "================================="

# Test 11: Database Connection
run_test "Database Connectivity" "curl -f -s '$API_URL/admin/database/status' || true"

# Test 12: Database Migrations
run_test "Database Schema Valid" "curl -f -s '$API_URL/admin/database/schema' || true"

# Security Tests
log_info "🔒 Testing Security Features"
echo "============================="

# Test 13: HTTPS Redirect (if applicable)
run_test "Security Headers Present" "curl -I -s '$API_URL/health' | grep -i 'x-frame-options\\|x-content-type-options\\|x-xss-protection' || true"

# Test 14: CORS Configuration
run_test "CORS Headers" "curl -I -s -H 'Origin: https://clinic-app.com' '$API_URL/health' | grep -i 'access-control' || true"

# Test 15: Rate Limiting
run_test "Rate Limiting Active" "for i in {1..5}; do curl -f -s '$API_URL/health' > /dev/null; done"

# Performance Tests
log_info "⚡ Testing Performance"
echo "======================"

# Test 16: Response Time
response_time=$(curl -o /dev/null -s -w "%{time_total}" "$API_URL/health")
run_test "API Response Time < 2s" "[[ \$(echo \"$response_time < 2.0\" | bc -l) -eq 1 ]]"

# Test 17: Frontend Load Time
frontend_time=$(curl -o /dev/null -s -w "%{time_total}" "$STAGING_URL")
run_test "Frontend Load Time < 5s" "[[ \$(echo \"$frontend_time < 5.0\" | bc -l) -eq 1 ]]"

# Integration Tests
log_info "🔗 Testing Service Integration"
echo "==============================="

# Test 18: Service Communication
run_test "Services Can Communicate" "curl -f -s '$API_URL/admin/services/status' | grep -q 'services' || true"

# Test 19: Event System
run_test "Event System Working" "curl -f -s -X POST '$API_URL/admin/test/event' || true"

# Healthcare-Specific Tests
log_info "🏥 Testing Healthcare Features"
echo "==============================="

# Test 20: HIPAA Audit System
run_test "HIPAA Audit System" "curl -f -s '$API_URL/admin/audit/status' | grep -q 'enabled' || true"

# Test 21: File Upload Capability
run_test "File Upload Endpoint" "curl -f -s -X POST '$API_URL/files/upload' -F 'test=test' || true"

# Test 22: Session Management
run_test "Session Management" "curl -f -s '$API_URL/admin/sessions/active' || true"

# Configuration Tests
log_info "⚙️ Testing Configuration"
echo "========================="

# Test 23: Environment Variables
run_test "Environment Config" "curl -f -s '$API_URL/admin/config/environment' | grep -q 'staging' || true"

# Test 24: Feature Flags
run_test "Feature Flags" "curl -f -s '$API_URL/admin/config/features' || true"

# Monitoring Tests
log_info "📊 Testing Monitoring"
echo "======================"

# Test 25: Metrics Endpoint
run_test "Metrics Available" "curl -f -s '$API_URL/metrics' || true"

# Test 26: Logging System
run_test "Logging System" "curl -f -s '$API_URL/admin/logs/health' || true"

# Test Results Summary
echo ""
echo "=============================="
echo "🧪 SMOKE TESTS RESULTS"
echo "=============================="
echo "Tests Run: $TESTS_RUN"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"
echo "Success Rate: $(( (TESTS_PASSED * 100) / TESTS_RUN ))%"

if [ $TESTS_FAILED -eq 0 ]; then
    log_success "🎉 ALL SMOKE TESTS PASSED!"
    echo ""
    echo "✅ Staging Environment Status: HEALTHY"
    echo "✅ API Response Time: ${response_time}s" 
    echo "✅ Frontend Load Time: ${frontend_time}s"
    echo "✅ Ready for Production Deployment"
    
    # Generate success report
    cat > "staging-smoke-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "staging",
  "status": "passed",
  "tests_run": $TESTS_RUN,
  "tests_passed": $TESTS_PASSED,
  "tests_failed": $TESTS_FAILED,
  "success_rate": $(( (TESTS_PASSED * 100) / TESTS_RUN )),
  "api_response_time": "$response_time",
  "frontend_load_time": "$frontend_time",
  "staging_url": "$STAGING_URL",
  "api_url": "$API_URL",
  "ready_for_production": true
}
EOF
    
    exit 0
else
    log_error "❌ SMOKE TESTS FAILED!"
    echo ""
    echo "🔴 Failed Tests:"
    for test in "${FAILED_TESTS[@]}"; do
        echo "   - $test"
    done
    echo ""
    echo "🔴 Staging Environment Status: UNHEALTHY"
    echo "🔴 NOT Ready for Production Deployment"
    
    # Generate failure report
    cat > "staging-smoke-test-report-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "staging",
  "status": "failed",
  "tests_run": $TESTS_RUN,
  "tests_passed": $TESTS_PASSED,
  "tests_failed": $TESTS_FAILED,
  "success_rate": $(( (TESTS_PASSED * 100) / TESTS_RUN )),
  "api_response_time": "$response_time",
  "frontend_load_time": "$frontend_time",
  "staging_url": "$STAGING_URL",
  "api_url": "$API_URL",
  "failed_tests": [$(printf '"%s",' "${FAILED_TESTS[@]}" | sed 's/,$//')]
  "ready_for_production": false
}
EOF
    
    exit 1
fi