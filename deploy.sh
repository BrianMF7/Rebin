#!/bin/bash

# ReBin Pro Production Deployment Script
# This script deploys the application to production with enhanced security measures

set -e  # Exit on any error

echo "🚀 Deploying ReBin Pro to Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment security checks
pre_deploy_checks() {
    print_status "Running pre-deployment security checks..."
    
    # Check if .env exists and has required variables
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create it from env.example"
        exit 1
    fi
    
    # Check for required environment variables
    required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "OPENROUTER_API_KEY" "ELEVENLABS_API_KEY")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=your_" .env; then
            print_error "Please set ${var} in your .env file with actual values"
            exit 1
        fi
    done
    
    # Check for production-specific variables
    if ! grep -q "^FRONTEND_ORIGIN=" .env || grep -q "^FRONTEND_ORIGIN=https://your-domain.com" .env; then
        print_error "Please set FRONTEND_ORIGIN in your .env file with your production domain"
        exit 1
    fi
    
    # Validate environment variables format
    if grep -q "your_" .env; then
        print_error "Please replace all placeholder values (your_*) in .env with actual values"
        exit 1
    fi
    
    print_success "Pre-deployment checks passed"
}

# Security scanning
security_scan() {
    print_status "Running security scans..."
    
    # Check if trivy is available for security scanning
    if command -v trivy &> /dev/null; then
        print_status "Running Trivy security scan on production images..."
        
        # Build production images first
        docker-compose -f docker-compose.prod.yml build --no-cache
        
        # Scan each service
        services=("backend" "frontend" "cv-mock")
        for service in "${services[@]}"; do
            print_status "Scanning $service image..."
            image_name=$(docker-compose -f docker-compose.prod.yml config | grep -A 5 "services:" | grep -A 5 "$service:" | grep "build:" | awk '{print $2}' || echo "rebin-1_${service}")
            trivy image --exit-code 1 --severity HIGH,CRITICAL "$image_name" || print_warning "Security scan found issues in $service. Please review."
        done
    else
        print_warning "Trivy not installed. Skipping security scan. Install with: brew install trivy"
    fi
}

# Backup existing deployment
backup_deployment() {
    print_status "Creating backup of existing deployment..."
    
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Export current environment
        cp .env "$backup_dir/"
        
        # Save current images
        docker-compose -f docker-compose.prod.yml config > "$backup_dir/docker-compose.prod.yml"
        
        print_success "Backup created in $backup_dir"
    else
        print_status "No existing deployment found, skipping backup"
    fi
}

# Deploy to production
deploy() {
    print_status "Deploying to production..."
    
    # Stop existing containers gracefully
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down --timeout 30
    
    # Build and start production containers
    print_status "Building production images..."
    docker-compose -f docker-compose.prod.yml build --no-cache --parallel
    
    print_status "Starting production services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 60
    
    # Check service health
    unhealthy_services=$(docker-compose -f docker-compose.prod.yml ps | grep "unhealthy" | wc -l)
    if [ "$unhealthy_services" -gt 0 ]; then
        print_error "Some services are unhealthy. Check logs with: docker-compose -f docker-compose.prod.yml logs"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    fi
    
    print_success "Deployment completed successfully!"
}

# Post-deployment verification
post_deploy_verification() {
    print_status "Running post-deployment verification..."
    
    # Check if all services are running
    running_services=$(docker-compose -f docker-compose.prod.yml ps | grep "Up" | wc -l)
    expected_services=3
    
    if [ "$running_services" -ne "$expected_services" ]; then
        print_error "Expected $expected_services services to be running, but found $running_services"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    fi
    
    # Test health endpoints
    print_status "Testing health endpoints..."
    
    # Test backend health
    if curl -f -s http://localhost:8000/health > /dev/null; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Test frontend health
    if curl -f -s http://localhost:80/health > /dev/null; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
    
    # Test CV service health
    if curl -f -s http://localhost:9000/health > /dev/null; then
        print_success "CV service health check passed"
    else
        print_error "CV service health check failed"
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Show deployment information
show_deployment_info() {
    print_status "Deployment Information:"
    echo ""
    echo "🌐 Frontend: http://your-domain.com (or configured FRONTEND_ORIGIN)"
    echo "🔧 Backend API: http://your-domain.com:8000"
    echo "📚 Backend Docs: http://your-domain.com:8000/docs"
    echo "🤖 CV Service: http://your-domain.com:9000"
    echo ""
    echo "📊 Service Status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "📝 View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "🛑 Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "🔄 Restart service: docker-compose -f docker-compose.prod.yml restart <service-name>"
}

# Rollback function
rollback() {
    print_status "Rolling back deployment..."
    
    # Find latest backup
    latest_backup=$(ls -t backups/ | head -1)
    
    if [ -z "$latest_backup" ]; then
        print_error "No backup found for rollback"
        exit 1
    fi
    
    print_status "Rolling back to backup: $latest_backup"
    
    # Stop current deployment
    docker-compose -f docker-compose.prod.yml down
    
    # Restore environment
    cp "backups/$latest_backup/.env" .env
    
    # Restart with previous configuration
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Rollback completed"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    echo "🎯 ReBin Pro - Production Deployment"
    echo "===================================="
    
    pre_deploy_checks
    security_scan
    backup_deployment
    deploy
    post_deploy_verification
    show_deployment_info
    
    echo ""
    print_success "Production deployment completed successfully! 🎉"
    echo ""
    echo "🔒 Security Features Enabled:"
    echo "  ✅ Non-root users in all containers"
    echo "  ✅ Read-only filesystems where possible"
    echo "  ✅ No new privileges security option"
    echo "  ✅ Resource limits and reservations"
    echo "  ✅ Network isolation with custom subnet"
    echo "  ✅ Enhanced security headers"
    echo "  ✅ Rate limiting and DDoS protection"
    echo "  ✅ Comprehensive logging and monitoring"
    echo ""
    echo "📋 Production Commands:"
    echo "  docker-compose -f docker-compose.prod.yml logs -f    - View logs"
    echo "  docker-compose -f docker-compose.prod.yml ps         - Check status"
    echo "  docker-compose -f docker-compose.prod.yml down       - Stop services"
    echo "  ./deploy.sh rollback                                 - Rollback to previous version"
    echo "  ./deploy.sh cleanup                                  - Clean up old images"
    echo ""
    echo "⚠️  Remember to:"
    echo "  - Set up SSL/TLS certificates"
    echo "  - Configure firewall rules"
    echo "  - Set up monitoring and alerting"
    echo "  - Regular security updates"
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        rollback
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac
