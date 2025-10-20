#!/bin/bash

# Healthcare Platform Production Deployment Script
# This script deploys the complete healthcare platform in production mode

set -e

echo "🏥 Healthcare Platform Production Deployment"
echo "============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 20+ first."
        exit 1
    fi
    
    # Check Yarn
    if ! command -v yarn &> /dev/null; then
        log_error "Yarn is not installed. Please install Yarn first."
        exit 1
    fi
    
    log_success "All prerequisites are installed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    # Copy environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "Copied .env.example to .env. Please update with production values."
        else
            log_error ".env.example not found. Please create environment configuration."
            exit 1
        fi
    fi
    
    # Generate JWT secret if not provided
    if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=$" .env; then
        JWT_SECRET=$(openssl rand -hex 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" .env
        log_info "Generated JWT secret"
    fi
    
    # Set production environment
    sed -i "s/NODE_ENV=.*/NODE_ENV=production/" .env
    
    log_success "Environment configured"
}

# Build dependencies
build_dependencies() {
    log_info "Building dependencies..."
    
    # Install root dependencies
    yarn install --frozen-lockfile
    
    # Build common library first
    log_info "Building @clinic/common library..."
    yarn workspace @clinic/common build
    
    # Build frontend
    log_info "Building frontend..."
    cd frontend
    yarn install --frozen-lockfile
    yarn build
    cd ..
    
    log_success "Dependencies built successfully"
}

# Create SSL certificates (self-signed for development)
setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    mkdir -p ssl
    
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Healthcare Platform/CN=localhost"
        log_success "SSL certificates generated"
    else
        log_info "SSL certificates already exist"
    fi
}

# Initialize database
init_database() {
    log_info "Initializing database..."
    
    # Start only database services first
    docker-compose -f docker-compose.production-ready.yml up -d postgres redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 30
    
    # Run database migrations
    log_info "Running database migrations..."
    
    # Check if we have migration scripts
    if [ -d "services/api-gateway/migrations" ]; then
        docker-compose -f docker-compose.production-ready.yml exec -T postgres \
            psql -U postgres -d clinic -f /docker-entrypoint-initdb.d/init-database.sql || true
    fi
    
    log_success "Database initialized"
}

# Deploy services
deploy_services() {
    log_info "Deploying all services..."
    
    # Build and start all services
    docker-compose -f docker-compose.production-ready.yml build --parallel
    docker-compose -f docker-compose.production-ready.yml up -d
    
    log_info "Waiting for services to be ready..."
    sleep 60
    
    log_success "All services deployed"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    local services=(
        "http://localhost:4000/health:API Gateway"
        "http://localhost:3001/health:Auth Service"
        "http://localhost:3002/health:Appointments Service"
        "http://localhost:3003/health:Files Service"
        "http://localhost:3004/health:Notifications Service"
        "http://localhost:3005/health:AI Service"
        "http://localhost:3006/health:Notes Service"
        "http://localhost:3007/health:Analytics Service"
        "http://localhost:3008/health:Settings Service"
        "http://localhost:3009/health:Billing Service"
        "http://localhost:3010/health:Search Service"
        "http://localhost:3011/health:CDN Service"
    )
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        IFS=':' read -r url name <<< "$service"
        
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "$name is healthy"
        else
            log_error "$name health check failed"
            failed_services+=("$name")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "All services are healthy"
        return 0
    else
        log_error "Some services failed health checks: ${failed_services[*]}"
        return 1
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Check if monitoring services are running
    if docker-compose -f docker-compose.production-ready.yml ps prometheus | grep -q "Up"; then
        log_success "Prometheus is running"
    else
        log_error "Prometheus is not running"
    fi
    
    if docker-compose -f docker-compose.production-ready.yml ps grafana | grep -q "Up"; then
        log_success "Grafana is running on http://localhost:3000"
        log_info "Default credentials: admin/admin (change on first login)"
    else
        log_error "Grafana is not running"
    fi
    
    log_success "Monitoring setup complete"
}

# Create admin user
create_admin_user() {
    log_info "Creating admin user..."
    
    # Wait for auth service to be ready
    sleep 10
    
    # Check if admin user already exists
    if docker-compose -f docker-compose.production-ready.yml exec -T postgres \
        psql -U postgres -d clinic -c "SELECT email FROM users WHERE role='admin' LIMIT 1;" | grep -q "@"; then
        log_info "Admin user already exists"
    else
        # Create admin user via API
        curl -X POST "http://localhost:4000/auth/register" \
            -H "Content-Type: application/json" \
            -d '{
                "email": "admin@clinic.local",
                "password": "Admin123!",
                "firstName": "Admin",
                "lastName": "User",
                "role": "admin"
            }' > /dev/null 2>&1 || true
        
        log_success "Admin user created: admin@clinic.local / Admin123!"
        log_warning "Please change the admin password after first login"
    fi
}

# Display deployment summary
display_summary() {
    echo ""
    echo "🎉 Production deployment completed successfully!"
    echo "=============================================="
    echo ""
    echo "🌐 Services:"
    echo "  • Frontend:              http://localhost:5173"
    echo "  • API Gateway:           http://localhost:4000"
    echo "  • Admin API Docs:        http://localhost:4000/api-docs"
    echo ""
    echo "📊 Monitoring:"
    echo "  • Grafana Dashboard:     http://localhost:3000"
    echo "  • Prometheus:            http://localhost:9090"
    echo "  • Logs (Loki):           http://localhost:3100"
    echo ""
    echo "💾 Data Storage:"
    echo "  • PostgreSQL:            localhost:5432"
    echo "  • Redis:                 localhost:6379"
    echo "  • MinIO Console:         http://localhost:9001"
    echo "  • Elasticsearch:         http://localhost:9200"
    echo ""
    echo "👤 Default Admin Account:"
    echo "  • Email:                 admin@clinic.local"
    echo "  • Password:              Admin123!"
    echo "  • ⚠️  Change password after first login"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • View logs:             docker-compose -f docker-compose.production-ready.yml logs -f [service]"
    echo "  • Restart service:       docker-compose -f docker-compose.production-ready.yml restart [service]"
    echo "  • Stop all services:     docker-compose -f docker-compose.production-ready.yml down"
    echo "  • View service status:   docker-compose -f docker-compose.production-ready.yml ps"
    echo ""
}

# Cleanup on failure
cleanup_on_failure() {
    log_error "Deployment failed. Cleaning up..."
    docker-compose -f docker-compose.production-ready.yml down
    exit 1
}

# Main deployment flow
main() {
    # Set trap for cleanup on failure
    trap cleanup_on_failure ERR
    
    log_info "Starting healthcare platform production deployment..."
    
    check_prerequisites
    setup_environment
    build_dependencies
    setup_ssl
    init_database
    deploy_services
    
    # Wait a bit for services to stabilize
    log_info "Waiting for services to stabilize..."
    sleep 30
    
    if health_check; then
        setup_monitoring
        create_admin_user
        display_summary
        log_success "🎉 Production deployment completed successfully!"
    else
        log_error "Health checks failed. Check service logs for details."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health")
        health_check
        ;;
    "stop")
        log_info "Stopping all services..."
        docker-compose -f docker-compose.production-ready.yml down
        log_success "All services stopped"
        ;;
    "restart")
        log_info "Restarting all services..."
        docker-compose -f docker-compose.production-ready.yml restart
        log_success "All services restarted"
        ;;
    "logs")
        docker-compose -f docker-compose.production-ready.yml logs -f "${2:-}"
        ;;
    "status")
        docker-compose -f docker-compose.production-ready.yml ps
        ;;
    *)
        echo "Usage: $0 {deploy|health|stop|restart|logs [service]|status}"
        echo ""
        echo "Commands:"
        echo "  deploy    - Full production deployment (default)"
        echo "  health    - Check service health"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  logs      - View logs (optionally for specific service)"
        echo "  status    - Show service status"
        exit 1
        ;;
esac