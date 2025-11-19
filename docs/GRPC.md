# gRPC Implementation

## Why gRPC?

**Current:** HTTP/REST between all services (slow, no type safety)
**New:** gRPC for service-to-service communication (5-10x faster, type-safe)

## Architecture

```
Frontend (React)
    ↓ REST/HTTP (keep as-is)
api-service (port 3000)
    ↓ gRPC (NEW)
github-service (port 3002 REST, 50052 gRPC)
    ↓ gRPC (NEW)
analysis-service (port 8001 REST, 50051 gRPC)
```

**What changes:**
- ✅ Service-to-service: gRPC (faster, type-safe)
- ✅ Frontend-to-backend: REST (no change)
- ✅ GitHub webhooks: REST (no change)

## Proto Files

Located in `/protos`:
- `analysis.proto` - Code analysis service contract
- `github.proto` - GitHub operations contract
- `common.proto` - Shared types

## Setup

### Install Dependencies

**Node.js services:**
```bash
cd services/api-service
npm install @grpc/grpc-js @grpc/proto-loader

cd services/github-service
npm install @grpc/grpc-js @grpc/proto-loader
```

**Python service:**
```bash
cd services/analysis-service
pip install grpcio==1.60.0 grpcio-tools==1.60.0
```

### Generate Python Code

```bash
cd services/analysis-service
python -m grpc_tools.protoc \
  -I../../protos \
  --python_out=./src/grpc/generated \
  --grpc_python_out=./src/grpc/generated \
  ../../protos/analysis.proto
```

### Run Services

```bash
docker-compose up
```

## Testing

### Test with grpcurl

```bash
# Install
brew install grpcurl

# Test analysis-service
grpcurl -plaintext localhost:50051 list
grpcurl -plaintext localhost:50051 analysis.AnalysisService/HealthCheck

# Test github-service
grpcurl -plaintext localhost:50052 list
grpcurl -plaintext localhost:50052 github.GitHubService/HealthCheck
```

### Test Code Analysis

```bash
grpcurl -plaintext -d '{
  "code": "print(x)",
  "language": "python",
  "file_path": "test.py",
  "pr_number": 1,
  "repository": "test/repo"
}' localhost:50051 analysis.AnalysisService/AnalyzeCode
```

## Troubleshooting

### Connection Refused
- Check service is running: `docker ps`
- Check port mapping in docker-compose.yml
- Check firewall/network settings

### Deadline Exceeded
- Increase timeout in client
- Check server logs for slow operations

### Invalid Argument
- Check request matches proto definition
- Verify field types (int vs string, etc)

## Performance

Expected improvements:
- **Response time:** 70-80% faster
- **Payload size:** 60-70% smaller
- **Throughput:** 5x more requests/second

## Migration Status

- [ ] Proto files created
- [ ] Dependencies installed
- [ ] analysis-service gRPC server
- [ ] github-service gRPC server
- [ ] github-service → analysis-service (gRPC client)
- [ ] api-service → github-service (gRPC client)
- [ ] Docker configuration updated
- [ ] Testing complete

## Rollback

If issues occur:
1. Set `USE_GRPC=false` in environment variables
2. Services fall back to HTTP
3. No data loss, zero downtime

# Basic Flow
  - api-service - REST server (for frontend) + gRPC client (calls github-service) ❌ No proto needed
  - github-service - REST server (for webhooks) + gRPC server + gRPC client (calls analysis-service) ✅ github.proto
  - analysis-service - gRPC server ✅ analysis.proto
