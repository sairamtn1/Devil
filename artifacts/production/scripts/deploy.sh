#!/bin/bash
# VOLGA OS - Deployment Script

set -e

echo "========================================"
echo "VOLGA OS Deployment Script"
echo "========================================"

# Configuration
APP_NAME="volga-os"
DEPLOY_DIR="/opt/volga"
BACKUP_DIR="/opt/volga/backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "Please run as root"
    exit 1
fi

# Parse command
COMMAND=${1:-deploy}

case $COMMAND in
    deploy)
        log "Starting deployment..."
        
        # Create directories
        log "Creating directories..."
        mkdir -p $DEPLOY_DIR
        mkdir -p $BACKUP_DIR
        
        # Build Docker images
        log "Building Docker images..."
        cd $DEPLOY_DIR
        docker-compose build
        
        # Stop old containers
        log "Stopping old containers..."
        docker-compose down || true
        
        # Start services
        log "Starting services..."
        docker-compose up -d
        
        # Wait for health check
        log "Waiting for services to be healthy..."
        sleep 10
        
        # Check health
        if curl -sf http://localhost:3000/api/healthz > /dev/null; then
            log "Deployment successful!"
        else
            error "Health check failed!"
            docker-compose logs
            exit 1
        fi
        
        log "VOLGA OS deployed successfully!"
        ;;
        
    stop)
        log "Stopping VOLGA OS..."
        cd $DEPLOY_DIR
        docker-compose down
        log "VOLGA OS stopped."
        ;;
        
    restart)
        log "Restarting VOLGA OS..."
        cd $DEPLOY_DIR
        docker-compose restart
        log "VOLGA OS restarted."
        ;;
        
    logs)
        log "Showing VOLGA OS logs..."
        cd $DEPLOY_DIR
        docker-compose logs -f
        ;;
        
    backup)
        log "Creating backup..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
        
        tar -czf $BACKUP_FILE -C $DEPLOY_DIR .
        log "Backup created: $BACKUP_FILE"
        ;;
        
    restore)
        log "Restoring from backup..."
        LATEST=$(ls -t $BACKUP_DIR/backup_*.tar.gz | head -1)
        if [ -z "$LATEST" ]; then
            error "No backup found!"
            exit 1
        fi
        
        cd $DEPLOY_DIR
        docker-compose down
        tar -xzf $LATEST
        docker-compose up -d
        log "Restored from: $LATEST"
        ;;
        
    status)
        log "Checking status..."
        curl -s http://localhost:3000/api/os/status | head -20
        ;;
        
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|backup|restore|status}"
        exit 1
        ;;
esac
