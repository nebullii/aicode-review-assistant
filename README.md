# CodeSentry

Microservices-based AI code review automation platform that integrates with GitHub to provide automated code analysis and review for your repositories.

## Features

### Core Functionality
- GitHub OAuth authentication
- Connect and manage GitHub repositories
- Automated webhook setup for pull request events
- Real-time code analysis and review
- Pull request monitoring and tracking
- Microservices architecture for scalability

### AI-Powered Analysis (Sprint 3)
- **Security Vulnerability Detection** (SCRUM-87, 97, 99)
  - AI-powered vulnerability detection using Google Vertex AI
  - Automatic classification by OWASP categories
  - Severity scoring (Critical, High, Medium, Low)
- **Code Style Analysis**
  - PEP 8 compliance checking (Python)
  - Code quality analysis with pylint
  - Naming convention validation
  - Code complexity detection
- **Automated PR Comments** (SCRUM-88)
  - Posts security findings directly on pull requests
  - Includes code snippets and recommendations
  - Summary reports with issue counts
- **Email Notifications** (Optional)
  - Automated email notifications to PR reviewers
  - Beautiful HTML emails with AI analysis preview
  - Shows top vulnerabilities and style issues
  - Direct links to PR for review

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
- Google Cloud Platform account (for AI analysis features)
- ngrok (for local webhook testing)

## Quick Start Checklist

Follow these steps in order to set up your development environment:

- [ ] Clone repository
- [ ] Set up Google Cloud Platform & Vertex AI
- [ ] Configure GitHub OAuth application
- [ ] Set up ngrok for webhooks
- [ ] Create all .env files
- [ ] Start backend services with Docker
- [ ] Start frontend
- [ ] Verify all services are running

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/nebullii/ai-code-review-assistant.git
cd ai-code-review-assistant
```

### 2. Set Up Google Cloud Platform (GCP) & Vertex AI

The analysis service uses Google Vertex AI for code analysis. Follow these steps:

#### 2.1 Create GCP Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "ai-code-review-dev")
4. Note your Project ID (you'll need this later)

#### 2.2 Enable Vertex AI API
1. In your GCP project, go to "APIs & Services" → "Library"
2. Search for "Vertex AI API"
3. Click "Enable"

#### 2.3 Create Service Account & Credentials
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `code-review-analysis` (or your choice)
4. Grant role: **Vertex AI User**
5. Click "Done"
6. Click on the created service account
7. Go to "Keys" tab → "Add Key" → "Create new key"
8. Choose "JSON" format and download
9. Save the JSON file as `gcp-service-account.json`

#### 2.4 Place Credentials File
```bash
# Create credentials directory in analysis service
mkdir -p services/analysis-service/credentials

# Move your downloaded JSON file here
mv ~/Downloads/your-gcp-key.json services/analysis-service/credentials/gcp-service-account.json
```

**Important:** The `credentials/` directory is in `.gitignore`. Never commit credentials to git!

### 3. Set Up ngrok for Local Webhook Testing

GitHub webhooks need a public URL. We use ngrok to create a tunnel to your local development server.

#### 3.1 Install ngrok
```bash
# macOS
brew install ngrok

# Windows (with Chocolatey)
choco install ngrok

# Or download from https://ngrok.com/download
```

#### 3.2 Start ngrok Tunnel
```bash
# In a separate terminal, keep this running
ngrok http 3002
```

#### 3.3 Copy the ngrok URL
You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3002
```

Copy the `https://abc123.ngrok-free.app` URL (you'll use it in step 5)

**Note:** Keep this terminal running! If you restart ngrok, you'll get a new URL and need to update your .env file.

### 4. Configure GitHub OAuth Application

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in the following:
   - Application name: AI Code Review Assistant (local dev)
   - Homepage URL: http://localhost:3001
   - Authorization callback URL: http://localhost:3000/auth/github/callback
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

### 5. Configure Environment Variables

Copy the example files and fill in your values:

```bash
# Copy all example files
cp services/api-service/.env.example services/api-service/.env
cp services/github-service/.env.example services/github-service/.env
cp services/analysis-service/.env.example services/analysis-service/.env
cp frontend/.env.example frontend/.env
```

Now edit each file with your specific values:

#### `services/api-service/.env`
```env
PORT=3000

# GitHub OAuth (from step 4)
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

#### `services/github-service/.env`
```env
PORT=3002
FRONTEND_URL=http://localhost:3001

# Webhook URL (from step 3 - your ngrok URL)
WEBHOOK_URL=https://abc123.ngrok-free.app

# Webhook Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
WEBHOOK_SECRET=your_webhook_secret_here

# Database
DATABASE_URL=postgresql://dev:devpass123@postgres:5432/code_review

# Email Notifications (Optional - see step 5a below)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM_NAME=AI Code Review Assistant
DEFAULT_REVIEWER_EMAIL=fallback@example.com
```

#### `services/analysis-service/.env`
```env
PORT=8001

# MongoDB Configuration
MONGODB_URL=mongodb://dev:devpass123@mongodb:27017/
MONGODB_DB_NAME=code_review_analysis

# Redis Configuration
REDIS_URL=redis://redis:6379

# Google Cloud / Vertex AI (from step 2)
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcp-service-account.json
GCP_PROJECT_ID=your-gcp-project-id-from-step-2
GCP_LOCATION=us-central1

# Analysis Configuration
MAX_FILE_SIZE_MB=10
ANALYSIS_TIMEOUT_SECONDS=60
ENABLE_STYLE_ANALYSIS=true
```

#### `frontend/.env`
```env
# API Service URL
VITE_API_URL=http://localhost:3000
```

### 5a. Configure Email Notifications (Optional)

Email notifications send reviewers a beautiful HTML email with a preview of AI-generated security vulnerabilities and style issues. **This is completely optional** - the system works fine without it.

#### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication on your Google account:**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App-Specific Password:**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it: "AI Code Review Assistant"
   - Click "Generate"
   - Copy the 16-character password

3. **Update `services/github-service/.env`:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=the-16-char-app-password-from-step-2
   EMAIL_FROM_NAME=AI Code Review Assistant
   ```

#### Option 2: SendGrid (Recommended for Production)

1. Create SendGrid account at https://sendgrid.com/
2. Generate API key
3. Update `.env`:
   ```env
   EMAIL_SERVICE=SendGrid
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   ```

#### Option 3: AWS SES

1. Set up AWS SES and verify domain
2. Get SMTP credentials
3. Update `.env`:
   ```env
   EMAIL_SERVICE=SES
   EMAIL_USER=your-ses-smtp-username
   EMAIL_PASSWORD=your-ses-smtp-password
   ```

#### Skip Email Notifications

Simply leave the `EMAIL_USER` and `EMAIL_PASSWORD` blank or remove them from `.env`. The service will log:
```
[NOTIFICATION] Email not configured - notifications disabled
```

And continue working normally without sending emails.

### 6. Start Backend Services
```bash
# Make sure Docker Desktop is running, then:
docker-compose up --build
```

This will start:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)
- API Service (port 3000)
- Analysis Service (port 8001)
- GitHub Service (port 3002)

Wait for all services to be healthy (may take 30-60 seconds on first run).

### 7. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3001

### 8. Verify Everything is Working

#### 8.1 Check Service Health
```bash
# API Service
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"api-service"}

# Analysis Service
curl http://localhost:8001/health
# Expected: {"status":"ok","service":"analysis-service","features":{...}}

# GitHub Service
curl http://localhost:3002/health
# Expected: {"status":"ok","service":"github-service"}
```

#### 8.2 Test GitHub OAuth
1. Open http://localhost:3001
2. Click "Login with GitHub"
3. You should be redirected to GitHub authorization
4. After authorizing, you should be redirected back to the dashboard

#### 8.3 Verify Database Connection
```bash
# Check PostgreSQL is accepting connections
docker exec -it code-review-postgres psql -U dev -d code_review -c "SELECT 1;"

# Check MongoDB
docker exec -it code-review-mongo mongosh -u dev -p devpass123 --eval "db.adminCommand('ping')"
```

#### 8.4 Test Webhook Delivery (Optional)
1. Connect a GitHub repository through the UI
2. Create a test pull request in that repository
3. Check the webhook logs: `docker-compose logs -f github-service`
4. You should see webhook events being received

#### 8.5 Test Code Analysis (Optional)
1. Connect a repository with Python code
2. Open a pull request
3. The system should automatically analyze the code and post comments
4. Check analysis logs: `docker-compose logs -f analysis-service`

### 9. Access Application URLs
- **Frontend**: http://localhost:3001
- **API Service**: http://localhost:3000
- **Analysis Service**: http://localhost:8001/docs (FastAPI interactive docs)
- **GitHub Service**: http://localhost:3002

## Testing

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

### Common Setup Issues

**Analysis service fails to start / GCP authentication errors:**
- Ensure you completed step 2 (GCP setup) fully
- Verify `gcp-service-account.json` exists in `services/analysis-service/credentials/`
- Check that `GCP_PROJECT_ID` in `.env` matches your actual GCP project ID
- Verify Vertex AI API is enabled in your GCP project
- Check analysis service logs: `docker-compose logs analysis-service`

**GitHub OAuth redirects to 404:**
- Ensure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set in `services/api-service/.env`
- Restart the API service: `docker-compose restart api-service`
- Verify the callback URL matches in both GitHub OAuth app settings and .env file
- Check the URL is exactly: `http://localhost:3000/auth/github/callback`

**Webhooks not being received:**
- Ensure ngrok is still running (check terminal)
- Verify `WEBHOOK_URL` in `services/github-service/.env` matches your current ngrok URL
- Remember: ngrok URLs change each time you restart ngrok
- Check GitHub webhook delivery in your repo settings: Settings → Webhooks → Recent Deliveries
- Verify webhook secret matches between GitHub and your `.env` file

**Dependencies not installing:**
- Check package.json has valid version numbers
- Run `npm install` in the specific service directory
- For Docker services, rebuild: `docker-compose up --build`
- Clear Docker cache: `docker-compose down && docker system prune -a`

**Database connection errors:**
- Ensure PostgreSQL container is healthy: `docker ps`
- Check DATABASE_URL in .env files matches docker-compose.yml settings
- Wait for database to initialize on first run (may take 10-20 seconds)
- View database logs: `docker-compose logs postgres`

**Port already in use:**
- Stop conflicting services or change ports in docker-compose.yml and .env files
- Common ports: 3000 (API), 3001 (Frontend), 3002 (GitHub), 5432 (PostgreSQL), 8001 (Analysis)
- Find what's using a port: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

**"Module not found" errors in Docker:**
- Rebuild containers: `docker-compose up --build`
- Clear volumes: `docker-compose down -v && docker-compose up --build`

**Frontend can't connect to API:**
- Verify `VITE_API_URL` in `frontend/.env` is `http://localhost:3000`
- Ensure API service is running and healthy

**Email notifications not working:**
- Check github-service logs: `docker-compose logs github-service | grep NOTIFICATION`
- If you see "[NOTIFICATION] Email not configured": Add EMAIL_USER and EMAIL_PASSWORD to `.env`
- Gmail authentication fails: Make sure you're using app-specific password, not regular password
- Emails not received: Check spam folder, verify email address is correct
- "Invalid login" error: Regenerate Gmail app-specific password
- Rate limiting: Gmail has daily sending limits (500/day for free accounts)
- Check if service initialized: Look for "[NOTIFICATION] ✓ Email notification service initialized" in logs
- Check browser console for CORS errors
- Try accessing API directly: `curl http://localhost:3000/health`

### Getting Help

If you encounter issues not covered here:
1. Check service logs: `docker-compose logs [service-name]`
2. Verify all environment variables are set correctly
3. Ensure all prerequisite services (Docker, Node.js, ngrok) are installed
4. Review the ENV_SETUP.md file for detailed environment variable documentation