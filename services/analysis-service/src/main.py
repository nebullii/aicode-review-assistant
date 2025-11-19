from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from config.database import connect_to_mongo, close_mongo_connection, get_database
from routes.analysis_routes import router as analysis_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Analysis Service...")
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

# Include analysis routes
app.include_router(analysis_router)

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
        "message": "Analysis Service API - AI Code Review Assistant",
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
    import threading
    from grpc import analysis_server

    # Start gRPC server in background thread
    grpc_thread = threading.Thread(target=analysis_server.serve, daemon=True)
    grpc_thread.start()
    print("✅ gRPC server started on port 50051")

    # Start FastAPI server (blocking)
    port = int(os.getenv("PORT", 8001))
    print(f"✅ REST API server starting on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)