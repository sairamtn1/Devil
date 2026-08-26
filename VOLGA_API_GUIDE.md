# VOLGA OS API Guide

## Overview

VOLGA OS provides a comprehensive REST API for managing all aspects of the AI Operating System.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API requests require an API key in the header:
```
X-API-Key: your-api-key
```

## Endpoints

### VOLGA OS Core

#### Get System Status
```http
GET /os/status
```
Returns the current status of VOLGA OS.

**Response:**
```json
{
  "version": "1.0.0",
  "name": "VOLGA OS",
  "codename": "DEVIL Reborn",
  "status": "ready",
  "uptime": 3600,
  "systems": [...]
}
```

#### Get Health Report
```http
GET /os/health
```
Returns comprehensive health report.

**Response:**
```json
{
  "overallScore": 94,
  "systems": [
    { "name": "Control Plane", "score": 98, "status": "healthy" }
  ],
  "recommendations": ["System is healthy"],
  "generatedAt": "2024-01-01T00:00:00Z"
}
```

#### Get Launch Readiness
```http
GET /os/readiness
```
Returns launch readiness assessment.

**Response:**
```json
{
  "overallScore": 94,
  "categories": [...],
  "readyForLaunch": true,
  "blockers": []
}
```

#### Launch System
```http
POST /os/launch-check
```
Initiates launch sequence.

**Response:**
```json
{
  "success": true,
  "message": "VOLGA OS v1.0 launched successfully!",
  "launchedAt": "2024-01-01T00:00:00Z"
}
```

### Agent Registry

#### List Agents
```http
GET /os/agents
```
Returns all registered agents.

**Query Parameters:**
- `capability` (optional): Filter by capability

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-brain",
      "name": "Brain Agent",
      "type": "intelligence",
      "capabilities": ["reasoning", "planning"],
      "reputation": 95,
      "availability": "available",
      "performance": 94,
      "status": "active"
    }
  ],
  "total": 10
}
```

#### Get Agent
```http
GET /os/agents/:id
```
Returns specific agent details.

### Mission Center

#### Create Mission
```http
POST /os/mission
```
Creates a new mission.

**Request:**
```json
{
  "title": "Build Web App",
  "description": "Create a modern web application",
  "agents": ["agent-coder", "agent-deploy"]
}
```

**Response:**
```json
{
  "id": "mis-abc123",
  "title": "Build Web App",
  "status": "planned",
  "agents": ["agent-coder", "agent-deploy"],
  "progress": 0,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### List Missions
```http
GET /os/missions
```
Returns all missions.

**Response:**
```json
{
  "missions": [...],
  "total": 25
}
```

#### Get Mission
```http
GET /os/mission/:id
```
Returns mission details.

### Dashboard

#### Get Unified Dashboard
```http
GET /os/dashboard
```
Returns complete system dashboard.

**Response:**
```json
{
  "overview": {
    "name": "VOLGA OS",
    "version": "1.0.0",
    "uptime": "1h 30m",
    "status": "ready"
  },
  "health": {...},
  "missions": {...},
  "agents": {...},
  "systems": {...},
  "readiness": {...}
}
```

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Rate Limits

| Tier | Requests/minute |
|------|-----------------|
| Free | 60 |
| Starter | 300 |
| Professional | 1000 |
| Enterprise | Unlimited |

## Webhooks

Subscribe to events:
```http
POST /webhooks
```
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["mission.completed", "agent.offline"]
}
```

---

**VOLGA OS API - Powering the Future of AI Operations**
