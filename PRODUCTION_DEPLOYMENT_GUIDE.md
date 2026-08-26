# VOLGA OS Production Deployment Guide

## Overview

This guide covers deploying VOLGA OS to production using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Domain name (e.g., volga.ai)
- SSL certificates

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/sairamtn1/Devil.git
cd Devil
```

### 2. Configure Environment
```bash
cd artifacts/production
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup SSL Certificates
```bash
mkdir -p ssl
# Add cert.pem and key.pem to ssl/
```

### 4. Deploy
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NODE_ENV | Set to production | Yes |
| PORT | API port (default: 3000) | No |
| DATABASE_URL | PostgreSQL connection string | Yes |
| REDIS_URL | Redis connection string | Yes |
| JWT_SECRET | JWT signing secret | Yes |
| API_KEY | API authentication key | Yes |

### External Services (Optional)

| Service | Environment Variable |
|---------|---------------------|
| GitHub OAuth | GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET |
| Google OAuth | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| Email (SMTP) | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS |
| Monitoring | SENTRY_DSN, DATADOG_API_KEY |

## Docker Setup

### Build Image
```bash
docker build -f artifacts/production/docker/Dockerfile -t volga-os:latest .
```

### Run with Docker Compose
```bash
cd artifacts/production/docker
docker-compose up -d
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| API | 3000 | VOLGA OS API server |
| Redis | 6379 | Caching and sessions |
| Nginx | 80, 443 | Reverse proxy |

## Nginx Configuration

The nginx.conf handles:
- SSL/TLS termination
- Reverse proxy to API
- Rate limiting
- Gzip compression
- Security headers

## Health Checks

### API Health
```bash
curl http://localhost:3000/api/healthz
```

### Full Status
```bash
curl http://localhost:3000/api/os/status
```

## Deployment Commands

```bash
./scripts/deploy.sh deploy    # Deploy
./scripts/deploy.sh stop      # Stop
./scripts/deploy.sh restart   # Restart
./scripts/deploy.sh logs      # View logs
./scripts/deploy.sh backup    # Create backup
./scripts/deploy.sh restore    # Restore backup
./scripts/deploy.sh status    # Check status
```

## Security

### Rate Limiting
- API: 100 requests/second
- Burst: 20 requests

### SSL/TLS
- TLS 1.2 and 1.3 only
- Strong cipher suites

### Security Headers
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security

## Monitoring

### Check Logs
```bash
docker-compose logs -f api
```

### Check Resource Usage
```bash
docker stats
```

### Analytics
```bash
curl http://localhost:3000/api/analytics
```

## Troubleshooting

### Container Won't Start
1. Check logs: `docker-compose logs api`
2. Verify environment variables
3. Check port availability

### Health Check Fails
1. Check database connection
2. Verify Redis is running
3. Review API logs

### SSL Errors
1. Verify certificate files exist
2. Check certificate validity
3. Ensure correct file permissions

## Maintenance

### Update VOLGA OS
```bash
git pull
./scripts/deploy.sh deploy
```

### Backup
```bash
./scripts/deploy.sh backup
```

### Restore
```bash
./scripts/deploy.sh restore
```

## Support

For issues, contact:
- Documentation: docs.volga.ai
- Support: support@volga.ai
