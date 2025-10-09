# Portal Deployment Guide

**Last Updated:** October 8, 2025  
**Framework:** SvelteKit 2.46.4  
**Runtime:** Node.js 20  
**Status:** Production Ready

---

## Overview

This guide covers deploying the Cable Platform Portal using Docker and Docker Compose. The portal is a SvelteKit application that runs as a Node.js server with server-side rendering (SSR).

---

## Architecture

### Deployment Stack

```
┌─────────────────────────────────────────┐
│         Load Balancer / Ingress         │
│         (nginx, k8s ingress)            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        Portal Container (Node.js)       │
│  - SvelteKit SSR Server                 │
│  - Port: 3000                           │
│  - Health: /health                      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        BFF Portal Container             │
│  - Business Logic Layer                 │
│  - Port: 4001                           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│        Backend Services                 │
│  (DRC, Catalog, etc.)                   │
└─────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Node.js:** 20+ (for local builds)
- **pnpm:** 8+ (for local builds)

### Required Services

- **BFF Portal:** Must be running and accessible
- **Backend Services:** DRC, Catalog, etc. must be available

---

## Environment Configuration

### Environment Variables

#### Required

```bash
# Node environment
NODE_ENV=production

# BFF URL (server-side, not exposed to client)
BFF_PORTAL_URL=http://bff-portal:4001

# Port (defaults to 3000)
PORT=3000
```

#### Optional

```bash
# Public BFF URL (client-side, if different from server-side)
PUBLIC_BFF_URL=http://localhost:4001

# Logging level
LOG_LEVEL=info

# Enable debug mode
DEBUG=false
```

### Configuration Files

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  portal:
    build:
      context: .
      dockerfile: Dockerfile.portal
    ports:
      - '5173:3000' # Host:Container
    environment:
      - NODE_ENV=production
      - BFF_PORTAL_URL=http://bff-portal:4001
      - PORT=3000
    depends_on:
      - bff-portal
    healthcheck:
      test:
        [
          'CMD',
          'node',
          '-e',
          "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))",
        ]
      interval: 30s
      timeout: 3s
      start_period: 5s
      retries: 3
    restart: unless-stopped
    networks:
      - cable-platform

  bff-portal:
    # BFF configuration
    ...

networks:
  cable-platform:
    driver: bridge
```

---

## Docker Build

### Dockerfile Overview

**File: `Dockerfile.portal`**

Multi-stage build for optimized images:

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/portal ./apps/portal
COPY shared ./shared

# Install and build
RUN corepack enable && \
    pnpm install --filter portal... && \
    pnpm --filter portal build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy only production files
COPY --from=builder /app/apps/portal/build ./build
COPY --from=builder /app/apps/portal/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "build/index.js"]
```

### Build Process

```bash
# Build single service
docker-compose build portal

# Build without cache (clean build)
docker-compose build --no-cache portal

# Build with specific tag
docker build -f Dockerfile.portal -t portal:v0.2.0 .
```

### Build Optimization

**Current Metrics:**

- Build time: ~30 seconds
- Image size: ~150MB
- Layers: 12

**Optimization Tips:**

- Use `.dockerignore` to exclude unnecessary files
- Multi-stage builds reduce final image size
- Alpine base image (smaller than Debian)
- Only copy production dependencies

**.dockerignore:**

```
node_modules
.git
.svelte-kit
build
dist
*.log
.env*
README.md
.vscode
.idea
```

---

## Local Deployment

### Quick Start

```bash
# From workspace root
docker-compose up -d portal

# Check status
docker-compose ps portal

# View logs
docker-compose logs -f portal

# Stop service
docker-compose stop portal

# Remove container
docker-compose down portal
```

### Development with Docker

```bash
# Build and run
docker-compose up --build portal

# Run in foreground (see logs)
docker-compose up portal

# Run specific services
docker-compose up portal bff-portal postgres
```

### Troubleshooting Local Deployment

**Issue: Port conflict**

```bash
# Check what's using port 5173
netstat -ano | findstr :5173  # Windows
lsof -ti:5173                 # Linux/Mac

# Change host port in docker-compose.yml
ports:
  - "8080:3000"  # Use 8080 instead
```

**Issue: Container won't start**

```bash
# Check logs
docker-compose logs portal

# Inspect container
docker-compose exec portal sh

# Check health
docker-compose exec portal wget -O- http://localhost:3000/health
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Docker build succeeds
- [ ] Environment variables configured
- [ ] Health check working
- [ ] Resource limits set
- [ ] Monitoring configured
- [ ] Backup/rollback plan ready

### Deployment Steps

#### 1. Build Production Image

```bash
# Tag with version
docker build -f Dockerfile.portal \
  -t registry.example.com/portal:v0.2.0 \
  -t registry.example.com/portal:latest \
  .

# Push to registry
docker push registry.example.com/portal:v0.2.0
docker push registry.example.com/portal:latest
```

#### 2. Deploy to Server

**Option A: Docker Compose (Simple)**

```bash
# On production server
docker-compose pull portal
docker-compose up -d portal

# Verify
curl http://localhost:5173/health
```

**Option B: Kubernetes (Advanced)**

See [Kubernetes Deployment](#kubernetes-deployment) section.

#### 3. Verify Deployment

```bash
# Health check
curl http://your-domain.com/health

# Expected response:
# {"status":"ok","timestamp":"...","service":"portal"}

# Test key routes
curl -I http://your-domain.com/
curl -I http://your-domain.com/drc
curl -I http://your-domain.com/synthesis
```

#### 4. Monitor

```bash
# Container stats
docker stats portal

# Logs
docker logs -f portal

# Health checks
watch -n 5 'curl -s http://localhost:5173/health | jq'
```

---

## Kubernetes Deployment

### Deployment Manifest

**File: `k8s/portal-deployment.yaml`**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: portal
  namespace: cable-platform
  labels:
    app: portal
    version: v0.2.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: portal
  template:
    metadata:
      labels:
        app: portal
        version: v0.2.0
    spec:
      containers:
        - name: portal
          image: registry.example.com/portal:v0.2.0
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: 'production'
            - name: BFF_PORTAL_URL
              value: 'http://bff-portal.cable-platform.svc.cluster.local:4001'
            - name: PORT
              value: '3000'
          resources:
            requests:
              memory: '64Mi'
              cpu: '100m'
            limits:
              memory: '256Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 2
---
apiVersion: v1
kind: Service
metadata:
  name: portal
  namespace: cable-platform
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      name: http
  selector:
    app: portal
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: portal
  namespace: cable-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - portal.example.com
      secretName: portal-tls
  rules:
    - host: portal.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: portal
                port:
                  number: 80
```

### Deploy to Kubernetes

```bash
# Apply deployment
kubectl apply -f k8s/portal-deployment.yaml

# Check rollout status
kubectl rollout status deployment/portal -n cable-platform

# Check pods
kubectl get pods -n cable-platform -l app=portal

# Check logs
kubectl logs -n cable-platform -l app=portal --tail=100 -f

# Scale replicas
kubectl scale deployment/portal --replicas=5 -n cable-platform
```

### Rolling Update

```bash
# Update image
kubectl set image deployment/portal \
  portal=registry.example.com/portal:v0.2.1 \
  -n cable-platform

# Monitor rollout
kubectl rollout status deployment/portal -n cable-platform

# Rollback if needed
kubectl rollout undo deployment/portal -n cable-platform
```

---

## Resource Requirements

### Recommended Resources

#### Development

```yaml
resources:
  requests:
    memory: '32Mi'
    cpu: '50m'
  limits:
    memory: '128Mi'
    cpu: '200m'
```

#### Production (per replica)

```yaml
resources:
  requests:
    memory: '64Mi'
    cpu: '100m'
  limits:
    memory: '256Mi'
    cpu: '500m'
```

### Observed Usage

From testing (Phase 6):

- **Memory:** 18MB (idle), 50MB (under load)
- **CPU:** 0.03% (idle), 5% (under load)
- **Disk:** 150MB (image), negligible runtime

### Scaling Guidelines

| Users    | Replicas | Memory/Replica | CPU/Replica |
| -------- | -------- | -------------- | ----------- |
| < 100    | 2        | 64Mi           | 100m        |
| 100-500  | 3        | 128Mi          | 200m        |
| 500-1000 | 5        | 128Mi          | 200m        |
| 1000+    | 10+      | 256Mi          | 500m        |

---

## Health Checks

### Health Endpoint

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-08T12:34:56.789Z",
  "service": "portal"
}
```

**Status Codes:**

- `200 OK` - Service healthy
- `500 Internal Server Error` - Service unhealthy

### Docker Health Check

```yaml
healthcheck:
  test:
    [
      'CMD',
      'node',
      '-e',
      "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))",
    ]
  interval: 30s
  timeout: 3s
  start_period: 5s
  retries: 3
```

### Kubernetes Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## Monitoring

### Metrics to Track

#### Application Metrics

- **Request Rate:** Requests per second
- **Response Time:** p50, p95, p99 latency
- **Error Rate:** 4xx, 5xx errors
- **Success Rate:** 2xx responses

#### System Metrics

- **CPU Usage:** % utilization
- **Memory Usage:** MB consumed
- **Disk I/O:** Read/write ops
- **Network:** Bytes in/out

#### Business Metrics

- **Page Views:** By route
- **DRC Runs:** Count, success rate
- **Synthesis Runs:** Count, success rate
- **User Sessions:** Active users

### Monitoring Tools

**Recommended Stack:**

```yaml
# Prometheus for metrics
- prometheus
- node-exporter
- cadvisor

# Grafana for dashboards
- grafana

# Loki for logs
- loki
- promtail

# Alerting
- alertmanager
```

### Example Dashboard

Key metrics to display:

1. **Availability:** Uptime %, health check status
2. **Performance:** Response times, throughput
3. **Errors:** Error rates by type, recent errors
4. **Resources:** CPU, memory, disk usage
5. **Traffic:** Requests per minute, top routes

---

## Logging

### Log Format

Structured JSON logging (recommended):

```json
{
  "timestamp": "2025-10-08T12:34:56.789Z",
  "level": "info",
  "service": "portal",
  "message": "Request processed",
  "method": "GET",
  "path": "/drc",
  "status": 200,
  "duration": 45
}
```

### Log Levels

- **ERROR:** Application errors, exceptions
- **WARN:** Warnings, recoverable issues
- **INFO:** General information, requests
- **DEBUG:** Detailed debugging information

### Accessing Logs

**Docker:**

```bash
# Tail logs
docker-compose logs -f portal

# Last 100 lines
docker-compose logs --tail=100 portal

# Logs since timestamp
docker-compose logs --since 2025-10-08T12:00:00 portal
```

**Kubernetes:**

```bash
# Pod logs
kubectl logs -n cable-platform -l app=portal -f

# Specific pod
kubectl logs -n cable-platform portal-abc123-xyz -f

# Previous container (after crash)
kubectl logs -n cable-platform portal-abc123-xyz --previous
```

### Log Retention

**Recommendations:**

- **Development:** 7 days
- **Staging:** 30 days
- **Production:** 90 days

---

## Backup & Recovery

### What to Backup

1. **Configuration:** docker-compose.yml, k8s manifests
2. **Environment Variables:** .env files (encrypted)
3. **Container Images:** Tagged versions in registry

### Rollback Strategy

**Docker Compose:**

```bash
# Tag before deployment
docker tag portal:latest portal:rollback

# If issues, restore previous
docker-compose down portal
docker tag portal:rollback portal:latest
docker-compose up -d portal
```

**Kubernetes:**

```bash
# Rollback to previous revision
kubectl rollout undo deployment/portal -n cable-platform

# Rollback to specific revision
kubectl rollout undo deployment/portal --to-revision=2 -n cable-platform

# View rollout history
kubectl rollout history deployment/portal -n cable-platform
```

---

## Security

### Best Practices

#### Container Security

- ✅ Run as non-root user
- ✅ Use Alpine base images (smaller attack surface)
- ✅ Scan images for vulnerabilities
- ✅ Keep dependencies updated
- ✅ Use multi-stage builds

#### Network Security

- ✅ Use internal networks for service communication
- ✅ Don't expose internal ports publicly
- ✅ Use TLS/SSL for external traffic
- ✅ Implement rate limiting

#### Application Security

- ✅ Validate all inputs
- ✅ Use environment variables for secrets
- ✅ Don't log sensitive data
- ✅ Implement CSRF protection
- ✅ Set security headers

### Security Headers

Add to reverse proxy (nginx, etc.):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

---

## Troubleshooting

### Common Issues

#### Issue: Container Exits Immediately

**Symptoms:** Container starts then stops

**Diagnosis:**

```bash
docker-compose logs portal
```

**Solutions:**

- Check for syntax errors in code
- Verify environment variables are set
- Check BFF_PORTAL_URL is correct
- Review build logs for errors

#### Issue: Health Check Failing

**Symptoms:** Container marked unhealthy

**Diagnosis:**

```bash
docker-compose exec portal wget -O- http://localhost:3000/health
```

**Solutions:**

- Verify port 3000 is correct
- Check if server is listening
- Review application logs
- Increase health check timeout

#### Issue: High Memory Usage

**Symptoms:** Container using > 256MB

**Diagnosis:**

```bash
docker stats portal
```

**Solutions:**

- Check for memory leaks
- Review long-running processes
- Restart container
- Increase memory limit if needed

#### Issue: Cannot Connect to BFF

**Symptoms:** API calls fail with connection errors

**Diagnosis:**

```bash
# From portal container
docker-compose exec portal ping bff-portal
docker-compose exec portal wget -O- http://bff-portal:4001/health
```

**Solutions:**

- Verify BFF_PORTAL_URL is correct
- Check BFF service is running
- Verify Docker network configuration
- Check DNS resolution

---

## Performance Tuning

### Node.js Optimization

```bash
# Set Node.js options
NODE_OPTIONS="--max-old-space-size=256 --optimize-for-size"
```

### PM2 for Process Management

```json
{
  "apps": [
    {
      "name": "portal",
      "script": "build/index.js",
      "instances": "max",
      "exec_mode": "cluster",
      "max_memory_restart": "256M"
    }
  ]
}
```

### Nginx Caching

```nginx
location / {
  proxy_pass http://portal:3000;
  proxy_cache_valid 200 10m;
  proxy_cache_bypass $http_cache_control;
  add_header X-Cache-Status $upstream_cache_status;
}
```

---

## Maintenance

### Regular Tasks

#### Weekly

- [ ] Review error logs
- [ ] Check resource usage trends
- [ ] Verify health checks passing
- [ ] Review monitoring dashboards

#### Monthly

- [ ] Update dependencies
- [ ] Review and rotate logs
- [ ] Test backup/restore
- [ ] Review security advisories

#### Quarterly

- [ ] Performance testing
- [ ] Disaster recovery drill
- [ ] Update documentation
- [ ] Review and update runbooks

---

## Runbook

### Deployment Runbook

1. **Pre-Deployment**
   - Run tests locally
   - Build and test Docker image
   - Notify team of deployment
   - Verify rollback plan

2. **Deployment**
   - Tag and push image
   - Update deployment config
   - Apply changes
   - Monitor rollout

3. **Post-Deployment**
   - Verify health checks
   - Check key routes
   - Monitor error rates
   - Update deployment log

### Incident Response

1. **Detection**
   - Alert triggered
   - User report
   - Monitoring dashboard

2. **Triage**
   - Check health endpoint
   - Review logs
   - Check dependencies
   - Assess severity

3. **Mitigation**
   - Rollback if critical
   - Scale up if resource issue
   - Fix and redeploy

4. **Post-Incident**
   - Document root cause
   - Update runbooks
   - Implement preventions

---

## References

### Internal Documentation

- [Portal Architecture](./PORTAL_ARCHITECTURE.md)
- [Portal README](../apps/portal/README.md)
- [Migration Guide](./SVELTEKIT_MIGRATION_PLAN.md)

### External Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Node.js Performance](https://nodejs.org/en/docs/guides/simple-profiling/)

---

**Document Owner:** DevOps Team  
**Reviewers:** Development Team, Tech Lead  
**Next Review:** After Phase 9 (Staging Deployment)
