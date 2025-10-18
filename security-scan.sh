#!/bin/bash

# ReBin Pro Security Scanning Script
# This script performs comprehensive security scans on the Docker setup

set -e

echo "🔒 Running Security Scans for ReBin Pro..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if required tools are installed
check_tools() {
    print_status "Checking security scanning tools..."
    
    tools=("trivy" "docker" "docker-compose")
    missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_status "Install missing tools:"
        for tool in "${missing_tools[@]}"; do
            case "$tool" in
                "trivy")
                    echo "  brew install trivy"
                    ;;
                "docker")
                    echo "  https://docs.docker.com/get-docker/"
                    ;;
                "docker-compose")
                    echo "  https://docs.docker.com/compose/install/"
                    ;;
            esac
        done
        exit 1
    fi
    
    print_success "All required tools are installed"
}

# Scan Docker images for vulnerabilities
scan_images() {
    print_status "Scanning Docker images for vulnerabilities..."
    
    # Build images first
    docker-compose build --no-cache
    
    # Get list of built images
    images=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep -E "(backend|frontend|cv-mock)" | grep -v "REPOSITORY")
    
    for image in $images; do
        print_status "Scanning image: $image"
        
        # Run Trivy scan
        if trivy image --exit-code 1 --severity HIGH,CRITICAL "$image"; then
            print_success "No high/critical vulnerabilities found in $image"
        else
            print_warning "Vulnerabilities found in $image. Review the output above."
        fi
        
        # Generate detailed report
        trivy image --format json --output "security-reports/${image//[\/:]/_}.json" "$image" || true
    done
}

# Scan Dockerfiles for security issues
scan_dockerfiles() {
    print_status "Scanning Dockerfiles for security issues..."
    
    dockerfiles=("backend/Dockerfile" "frontend/Dockerfile" "frontend/Dockerfile.prod" "services/cv-mock/Dockerfile")
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$dockerfile" ]; then
            print_status "Scanning $dockerfile"
            
            # Check for common security issues
            issues=()
            
            # Check for root user
            if grep -q "USER root" "$dockerfile"; then
                issues+=("Uses root user")
            fi
            
            # Check for latest tag
            if grep -q "FROM.*:latest" "$dockerfile"; then
                issues+=("Uses latest tag")
            fi
            
            # Check for secrets in Dockerfile
            if grep -q -E "(password|secret|key|token)" "$dockerfile"; then
                issues+=("Potential secrets in Dockerfile")
            fi
            
            if [ ${#issues[@]} -eq 0 ]; then
                print_success "No security issues found in $dockerfile"
            else
                print_warning "Security issues found in $dockerfile:"
                for issue in "${issues[@]}"; do
                    echo "  - $issue"
                done
            fi
        fi
    done
}

# Scan docker-compose files
scan_compose_files() {
    print_status "Scanning docker-compose files for security issues..."
    
    compose_files=("docker-compose.yml" "docker-compose.prod.yml")
    
    for compose_file in "${compose_files[@]}"; do
        if [ -f "$compose_file" ]; then
            print_status "Scanning $compose_file"
            
            issues=()
            
            # Check for privileged mode
            if grep -q "privileged: true" "$compose_file"; then
                issues+=("Uses privileged mode")
            fi
            
            # Check for host network
            if grep -q "network_mode: host" "$compose_file"; then
                issues+=("Uses host network")
            fi
            
            # Check for secrets in environment
            if grep -q -E "(password|secret|key|token)" "$compose_file"; then
                issues+=("Potential secrets in environment variables")
            fi
            
            if [ ${#issues[@]} -eq 0 ]; then
                print_success "No security issues found in $compose_file"
            else
                print_warning "Security issues found in $compose_file:"
                for issue in "${issues[@]}"; do
                    echo "  - $issue"
                done
            fi
        fi
    done
}

# Check for .dockerignore files
check_dockerignore() {
    print_status "Checking for .dockerignore files..."
    
    services=("backend" "frontend" "services/cv-mock")
    
    for service in "${services[@]}"; do
        if [ -f "$service/.dockerignore" ]; then
            print_success ".dockerignore found in $service"
        else
            print_warning ".dockerignore missing in $service"
        fi
    done
}

# Generate security report
generate_report() {
    print_status "Generating security report..."
    
    report_dir="security-reports"
    mkdir -p "$report_dir"
    
    report_file="$report_dir/security-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# ReBin Pro Security Scan Report

**Generated:** $(date)
**Scanner:** Trivy + Custom Security Checks

## Summary

This report contains the results of security scans performed on the ReBin Pro Docker setup.

## Scanned Components

- Docker Images
- Dockerfiles
- Docker Compose Files
- .dockerignore Files

## Recommendations

1. **Regular Updates**: Keep base images and dependencies updated
2. **Security Scanning**: Run security scans regularly in CI/CD pipeline
3. **Secrets Management**: Use Docker secrets or external secret management
4. **Network Security**: Implement proper network segmentation
5. **Monitoring**: Set up security monitoring and alerting

## Files Scanned

EOF

    # Add list of scanned files
    find . -name "Dockerfile*" -o -name "docker-compose*.yml" -o -name ".dockerignore" | sort >> "$report_file"
    
    print_success "Security report generated: $report_file"
}

# Main function
main() {
    echo "🔒 ReBin Pro Security Scan"
    echo "========================="
    
    check_tools
    scan_dockerfiles
    scan_compose_files
    check_dockerignore
    scan_images
    generate_report
    
    echo ""
    print_success "Security scan completed! 🎉"
    echo ""
    echo "📋 Next Steps:"
    echo "  1. Review any warnings or errors above"
    echo "  2. Check the generated security report"
    echo "  3. Update vulnerable dependencies"
    echo "  4. Implement recommended security measures"
    echo ""
    echo "📁 Reports saved in: security-reports/"
}

# Run main function
main "$@"
