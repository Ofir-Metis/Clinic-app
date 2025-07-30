#!/bin/bash

# E2E Testing Script for Clinic Management App
# Runs Playwright tests with proper setup and teardown

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🧪 Starting E2E Test Suite${NC}"

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}📋 Checking requirements...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v yarn &> /dev/null; then
        echo -e "${RED}❌ Yarn is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Setup test environment
setup_environment() {
    echo -e "${YELLOW}🔧 Setting up test environment...${NC}"
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file${NC}"
    fi
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    yarn install --frozen-lockfile
    
    # Build shared library
    echo -e "${YELLOW}🔨 Building shared library...${NC}"
    yarn workspace @clinic/common build
    
    # Install Playwright browsers
    echo -e "${YELLOW}🌐 Installing Playwright browsers...${NC}"
    npx playwright install
    
    echo -e "${GREEN}✅ Environment setup complete${NC}"
}

# Start infrastructure services
start_services() {
    echo -e "${YELLOW}🚀 Starting infrastructure services...${NC}"
    
    # Start test infrastructure
    docker compose -f docker-compose.test.yml up -d
    
    # Wait for services to be healthy
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f docker-compose.test.yml ps | grep -q "healthy"; then
            echo -e "${GREEN}✅ Infrastructure services are ready${NC}"
            break
        fi
        
        attempt=$((attempt + 1))
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - waiting for services...${NC}"
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ Services failed to start within timeout${NC}"
        cleanup
        exit 1
    fi
}

# Start application services
start_application() {
    echo -e "${YELLOW}🏥 Starting application services...${NC}"
    
    # Run database migrations
    echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
    yarn workspace auth-service migration:run || echo "Migrations may have already run"
    yarn workspace appointments-service migration:run || echo "Migrations may have already run"
    
    # Start backend services in background
    echo -e "${YELLOW}⚙️ Starting backend services...${NC}"
    yarn workspace api-gateway start &
    API_GATEWAY_PID=$!
    
    yarn workspace auth-service start &
    AUTH_SERVICE_PID=$!
    
    yarn workspace appointments-service start &
    APPOINTMENTS_SERVICE_PID=$!
    
    yarn workspace notifications-service start &
    NOTIFICATIONS_SERVICE_PID=$!
    
    # Wait for backend services
    sleep 30
    
    # Start frontend
    echo -e "${YELLOW}🖥️ Starting frontend...${NC}"
    cd frontend
    yarn build
    yarn preview &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend
    sleep 10
    
    # Verify services are running
    echo -e "${YELLOW}🔍 Verifying services...${NC}"
    
    if ! curl -s http://localhost:4000/health > /dev/null; then
        echo -e "${RED}❌ API Gateway not responding${NC}"
        cleanup
        exit 1
    fi
    
    if ! curl -s http://localhost:5175 > /dev/null; then
        echo -e "${RED}❌ Frontend not responding${NC}"
        cleanup
        exit 1
    fi
    
    echo -e "${GREEN}✅ Application services are ready${NC}"
}

# Run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running Playwright tests...${NC}"
    
    # Parse command line arguments
    BROWSER="chromium"
    TEST_PATTERN=""
    HEADED=""
    DEBUG=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --browser)
                BROWSER="$2"
                shift 2
                ;;
            --headed)
                HEADED="--headed"
                shift
                ;;
            --debug)
                DEBUG="--debug"
                shift
                ;;
            --grep)
                TEST_PATTERN="--grep $2"
                shift 2
                ;;
            *)
                # Unknown option
                shift
                ;;
        esac
    done
    
    # Run tests
    if npx playwright test --project=$BROWSER $HEADED $DEBUG $TEST_PATTERN; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        TEST_SUCCESS=true
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        TEST_SUCCESS=false
    fi
    
    # Generate report
    echo -e "${YELLOW}📊 Generating test report...${NC}"
    npx playwright show-report --host=0.0.0.0 &
    REPORT_PID=$!
    
    echo -e "${GREEN}📊 Test report available at: http://localhost:9323${NC}"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    # Kill application processes
    if [ ! -z "$API_GATEWAY_PID" ]; then
        kill $API_GATEWAY_PID 2>/dev/null || true
    fi
    if [ ! -z "$AUTH_SERVICE_PID" ]; then
        kill $AUTH_SERVICE_PID 2>/dev/null || true
    fi
    if [ ! -z "$APPOINTMENTS_SERVICE_PID" ]; then
        kill $APPOINTMENTS_SERVICE_PID 2>/dev/null || true
    fi
    if [ ! -z "$NOTIFICATIONS_SERVICE_PID" ]; then
        kill $NOTIFICATIONS_SERVICE_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$REPORT_PID" ]; then
        kill $REPORT_PID 2>/dev/null || true
    fi
    
    # Kill any remaining yarn processes
    pkill -f "yarn workspace" 2>/dev/null || true
    
    # Stop Docker services
    docker compose -f docker-compose.test.yml down
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Trap cleanup on exit
trap cleanup EXIT

# Show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --browser BROWSER    Run tests on specific browser (chromium, firefox, webkit)"
    echo "  --headed            Run tests in headed mode (visible browser)"
    echo "  --debug             Run tests in debug mode"
    echo "  --grep PATTERN      Run tests matching pattern"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                 # Run all tests in chromium"
    echo "  $0 --browser firefox               # Run tests in Firefox"
    echo "  $0 --headed --browser webkit       # Run tests in Safari with visible browser"
    echo "  $0 --grep 'authentication'        # Run only authentication tests"
    echo "  $0 --debug --grep 'patient'       # Debug patient-related tests"
}

# Main execution
main() {
    # Check for help flag
    if [[ "$1" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    echo -e "${GREEN}🏥 Clinic Management App - E2E Test Suite${NC}"
    echo -e "${GREEN}===========================================${NC}"
    
    check_requirements
    setup_environment
    start_services
    start_application
    run_tests "$@"
    
    if [ "$TEST_SUCCESS" = true ]; then
        echo -e "${GREEN}🎉 E2E Test Suite completed successfully!${NC}"
        exit 0
    else
        echo -e "${RED}💥 E2E Test Suite failed${NC}"
        exit 1
    fi
}

# Run main function with all arguments
main "$@"