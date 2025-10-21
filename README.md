# AI Code Review Assistant

Microservices-based AI code review automation platform that integrates with GitHub to provide automated code analysis and review for your repositories.

## Features

- GitHub OAuth authentication
- Connect and manage GitHub repositories
- Automated webhook setup for pull request events
- Real-time code analysis and review
- Pull request monitoring and tracking
- Microservices architecture for scalability

## Architecture

- **API Service** (Node.js/Express) - Port 3000 - Handles authentication, user management, and repository connections
- **Analysis Service** (Python/FastAPI) - Port 8001 - Performs automated code analysis
- **GitHub Service** (Node.js/Express) - Port 3002 - Manages GitHub webhooks and integrations
- **Frontend** (React/Vite/Tailwind) - Port 3001 - User interface for managing repositories and viewing analysis results
- **PostgreSQL** - Port 5432 - Stores users, repositories, and analysis metadata
- **MongoDB** - Port 27017 - Stores detailed analysis results
- **Redis** - Port 6379 - Caching and session management

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

### 2. Configure GitHub OAuth Application

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the following:
   - Application name: AI Code Review Assistant (local dev)
   - Homepage URL: http://localhost:3001
   - Authorization callback URL: http://localhost:3000/auth/github/callback
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

### 3. Configure Environment Variables

Create `services/api-service/.env`:
```env
PORT=3000

# GitHub OAuth (use values from step 2)
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_jwt_secret_here_min_32_chars

# Database
DATABASE_URL=postgresql://dev:devpass123@postgres:5432/code_review
REDIS_URL=redis://redis:6379

# Services
GITHUB_SERVICE_URL=http://github-service:3002
```

Create `services/github-service/.env`:
```env
PORT=3002

# Webhook URL (use ngrok URL for local development)
WEBHOOK_URL=https://your-ngrok-url.ngrok-free.app

# Webhook Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
WEBHOOK_SECRET=your_webhook_secret_here

# Database
DATABASE_URL=postgresql://dev:devpass123@postgres:5432/code_review
```

### 4. Start Backend Services
```bash
docker-compose up --build
```

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Access Application
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

## Troubleshooting

**GitHub OAuth redirects to 404:**
- Ensure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set in `services/api-service/.env`
- Restart the API service: `docker-compose restart api-service`
- Verify the callback URL matches in both GitHub OAuth app settings and .env file

**Dependencies not installing:**
- Check package.json has valid version numbers
- Run `npm install` in the specific service directory
- For Docker services, rebuild: `docker-compose up --build`

**Database connection errors:**
- Ensure PostgreSQL container is healthy: `docker ps`
- Check DATABASE_URL in .env files matches docker-compose.yml settings
- Wait for database to initialize on first run (may take 10-20 seconds)

**Port already in use:**
- Stop conflicting services or change ports in docker-compose.yml and .env files
- Common ports: 3000 (API), 3001 (Frontend), 3002 (GitHub), 5432 (PostgreSQL), 8001 (Analysis)