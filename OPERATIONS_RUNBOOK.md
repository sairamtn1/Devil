# VOLGA OS Operations Runbook

## Daily Operations

### Morning Health Check
```bash
# Check all services
curl http://localhost:3000/api/os/health

# Check analytics
curl http://localhost:3000/api/analytics

# Check errors
curl http://localhost:3000/api/errors?severity=critical&limit=10

# View recent logs
docker-compose logs --tail=100 api
```

### System Status
```bash
# Full status
curl http://localhost:3000/api/os/status

# Dashboard
curl http://localhost:3000/api/os/dashboard

# Agent health
curl http://localhost:3000/api/os/agents
```

## Common Operations

### Deploy Updates
```bash
# Pull latest code
git pull

# Rebuild and deploy
./scripts/deploy.sh deploy

# Verify deployment
curl http://localhost:3000/api/healthz
```

### Restart Services
```bash
# Restart API
docker-compose restart api

# Restart all services
docker-compose restart

# Full stop and start
docker-compose down && docker-compose up -d
```

### View Logs
```bash
# API logs
docker-compose logs -f api

# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

## Troubleshooting

### Service Won't Start
1. Check environment variables
```bash
cat .env | grep -E "^[A-Z]"
```

2. Check port conflicts
```bash
netstat -tulpn | grep 3000
```

3. Check logs
```bash
docker-compose logs api
```

4. Restart with fresh containers
```bash
docker-compose down -v
docker-compose up -d
```

### Database Connection Issues
1. Verify DATABASE_URL
```bash
echo $DATABASE_URL
```

2. Test connection
```bash
psql $DATABASE_URL -c "SELECT 1"
```

3. Check database logs
```bash
docker-compose logs postgres
```

### High Memory Usage
1. Check container stats
```bash
docker stats
```

2. Clear Docker cache
```bash
docker system prune -a
```

3. Increase memory limit in docker-compose.yml

### API Errors
1. Check error logs
```bash
docker-compose logs api | grep ERROR
```

2. Check recent errors via API
```bash
curl http://localhost:3000/api/errors?limit=20
```

3. Restart API
```bash
docker-compose restart api
```

## Monitoring

### Check Performance
```bash
# API response time
time curl http://localhost:3000/api/os/status

# Database queries (if slow)
docker-compose exec postgres psql -U volga -c "SELECT * FROM pg_stat_activity"
```

### Check Resources
```bash
# Container stats
docker stats --no-stream

# Disk usage
df -h

# Memory
free -m
```

### Check Security
```bash
# Failed login attempts (check logs)
docker-compose logs api | grep "Invalid login"

# SSL certificate
openssl s_client -connect volga.ai:443 -servername volga.ai </dev/null 2>/dev/null | openssl x509 -noout -dates
```

## Backup & Restore

### Create Backup
```bash
./scripts/deploy.sh backup
```

### Restore Backup
```bash
./scripts/deploy.sh restore
```

### Manual Database Backup
```bash
# Create SQL dump
docker-compose exec postgres pg_dump -U volga volga > backup.sql

# Restore from dump
docker-compose exec -T postgres psql -U volga volga < backup.sql
```

## Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
api:
  ...
  deploy:
    replicas: 3
```

### Vertical Scaling
```bash
# Increase memory/CPU
docker-compose up -d --scale api=2
```

## Incident Response

### P1 - Complete Outage
1. Check all services
```bash
docker-compose ps
docker-compose logs --tail=50
```

2. Restart all services
```bash
docker-compose restart
```

3. If not resolved, restore from backup

### P2 - Partial Outage
1. Identify affected component
2. Check specific service logs
3. Restart affected service
4. Monitor for recovery

### P3 - Degraded Performance
1. Check resource usage
2. Check database performance
3. Check external dependencies
4. Optimize or scale

## Emergency Contacts

| Role | Contact |
|------|---------|
| On-Call Engineer | oncall@volga.ai |
| DevOps Lead | devops@volga.ai |
| CTO | cto@volga.ai |

## Runbook Version

- Version: 1.0
- Last Updated: 2024
- Next Review: Monthly
