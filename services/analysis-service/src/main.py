import os
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from prometheus_client import Histogram, CONTENT_TYPE_LATEST, generate_latest
from config.database import connect_to_mongo, close_mongo_connection, get_database
from routes.analysis_routes import router as analysis_router
from grpc_server.analysis_server import serve as serve_grpc

# Prometheus HTTP duration histogram for RED metrics
http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path", "status_code"],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Analysis Service...")

    # Start gRPC server in a background thread
    grpc_thread = threading.Thread(target=serve_grpc, daemon=True)
    grpc_thread.start()
    print("✅ gRPC server started in background thread.")

    await connect_to_mongo()
    print("✅ Analysis Service Ready!")
    yield
    # Shutdown
    print("🛑 Shutting down Analysis Service...")
    await close_mongo_connection()

app = FastAPI(
    title="Analysis Service", 
    version="1.0.0",
    description="SCRUM-87: Security Vulnerability Detection | SCRUM-97: Classification | SCRUM-99: Severity Scoring",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Record HTTP durations for RED metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    route = request.scope.get("route")
    path = getattr(route, "path", request.url.path)
    http_request_duration_seconds.labels(request.method, path, response.status_code).observe(duration)
    return response

# Include analysis routes
app.include_router(analysis_router)


@app.get("/metrics")
async def metrics():
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.get("/health")
async def health_check():
    try:
        db = get_database()
        await db.command("ping")
        
        return {
            "status": "ok",
            "service": "analysis-service",
            "database": "connected",
            "scrum_tasks": ["SCRUM-87", "SCRUM-97", "SCRUM-99"]
        }
    except Exception as e:
        return {
            "status": "error",
            "service": "analysis-service",
            "database": "disconnected",
            "error": str(e)
        }

@app.get("/")
async def root():
    return {
        "message": "CodeSentry Analysis Service",
        "version": "1.0.0",
        "endpoints": {
            "POST /api/analysis/analyze": "Analyze code for vulnerabilities",
            "GET /api/analysis/history": "Get analysis history",
            "GET /health": "Health check"
        },
        "features": {
            "SCRUM-87": "Security Vulnerability Detection with Vertex AI",
            "SCRUM-97": "Vulnerability Classification System",
            "SCRUM-99": "Severity Scoring System"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
