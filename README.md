# AI Code Review Assistant

Microservices-based AI code review automation platform for Python projects.

## Architecture

- **API Service** (Node.js/Express) - Port 3000
- **Analysis Service** (Python/FastAPI) - Port 8001
- **GitHub Service** (Node.js/Express) - Port 3002
- **Frontend** (HTML/Tailwind) - Port 3001

## Prerequisites

- Docker Desktop
- Node.js 18+
- Git

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/nebullii/ai-code-review-assistant.git
cd ai-code-review-assistant
```

### 2. Configure Environment Variables

Create `services/api-service/.env`:
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
JWT_SECRET=your_jwt_secret_min_32_chars
DATABASE_URL=postgresql://dev:devpass123@postgres:5432/code_review
REDIS_URL=redis://redis:6379
```

### 3. Start Backend Services
```bash
docker-compose up --build
```

### 4. Start Frontend
```bash
cd frontend
npm install
node server.js
```

### 5. Access Application
- Frontend: http://localhost:3001
- API: http://localhost:3000
- Analysis: http://localhost:8001

## Testing

**Health checks:**
```bash
curl http://localhost:3000/health
curl http://localhost:8001/health
curl http://localhost:3002/health
```

## Development

**View logs:**
```bash
docker-compose logs -f api-service
```

**Restart service:**
```bash
docker-compose restart api-service
```

**Stop all:**
```bash
docker-compose down
```
```# Webhook Test - Tue Oct 21 15:27:43 EDT 2025
