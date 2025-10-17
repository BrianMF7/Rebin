#!/bin/bash

# ReBin Pro Docker Setup Script
# This script sets up the development environment with Docker following security best practices

set -e  # Exit on any error

echo "🐳 Setting up ReBin Pro with Docker..."

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

# Check Docker installation and security
check_docker() {
    print_status "Checking Docker installation and security..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker from https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    # Check Docker version (minimum 20.10.0 for security features)
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    REQUIRED_VERSION="20.10.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$DOCKER_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_warning "Docker version $DOCKER_VERSION detected. Version $REQUIRED_VERSION or higher is recommended for security features."
    fi
    
    print_success "Docker is properly installed and running"
}

# Validate environment files
validate_environment() {
    print_status "Validating environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp env.example .env
        print_warning "Please update .env with your actual API keys before running in production"
    fi
    
    # Check for required environment variables
    required_vars=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "OPENROUTER_API_KEY" "ELEVENLABS_API_KEY")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=your_" .env; then
            print_warning "Please set ${var} in your .env file"
        fi
    done
    
    print_success "Environment validation completed"
}

# Security scan of Docker images
security_scan() {
    print_status "Performing security scan of Docker images..."
    
    # Check if trivy is available for security scanning
    if command -v trivy &> /dev/null; then
        print_status "Running Trivy security scan..."
        docker-compose build --no-cache
        trivy image --exit-code 1 --severity HIGH,CRITICAL $(docker-compose config | grep 'image:' | awk '{print $2}' | head -1) || print_warning "Security scan found issues. Please review."
    else
        print_warning "Trivy not installed. Skipping security scan. Install with: brew install trivy"
    fi
}

# Build and start services with security measures
start_services() {
    print_status "Building and starting services with security measures..."
    
    # Stop any existing containers
    docker-compose down --remove-orphans
    
    # Build images with no cache for security
    print_status "Building Docker images..."
    docker-compose build --no-cache --parallel
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "unhealthy"; then
        print_error "Some services are unhealthy. Check logs with: docker-compose logs"
        docker-compose ps
        exit 1
    fi
    
    print_success "Services started successfully!"
}

# Show service information
show_service_info() {
    print_status "Service Information:"
    echo ""
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 Backend Docs: http://localhost:8000/docs"
    echo "🤖 CV Service: http://localhost:9000"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 View logs: docker-compose logs -f"
    echo "🛑 Stop services: docker-compose down"
    echo "🔄 Restart service: docker-compose restart <service-name>"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    docker-compose down --remove-orphans
    docker system prune -f
    print_success "Cleanup completed"
}

# Main setup function
main() {
    echo "🎯 ReBin Pro - Secure Docker Setup"
    echo "=================================="
    
    check_docker
    validate_environment
    security_scan
    start_services
    show_service_info
    
    echo ""
    print_success "Setup completed successfully! 🎉"
    echo ""
    echo "🔒 Security Features Enabled:"
    echo "  ✅ Non-root users in all containers"
    echo "  ✅ Multi-stage builds for smaller attack surface"
    echo "  ✅ Network isolation with custom subnet"
    echo "  ✅ Resource limits to prevent DoS attacks"
    echo "  ✅ Health checks for all services"
    echo "  ✅ Log rotation and monitoring"
    echo "  ✅ Security headers in nginx"
    echo ""
    echo "📋 Available Commands:"
    echo "  docker-compose up -d          - Start all services"
    echo "  docker-compose down           - Stop all services"
    echo "  docker-compose logs -f        - View logs"
    echo "  docker-compose ps             - Check service status"
    echo "  docker-compose restart <svc>  - Restart specific service"
    echo "  ./docker-setup.sh cleanup     - Clean up containers and images"
    echo ""
    echo "🚀 For production deployment:"
    echo "  ./deploy.sh"
}

# Handle cleanup command
if [ "$1" = "cleanup" ]; then
    cleanup
    exit 0
fi

# Run main function
main "$@"
