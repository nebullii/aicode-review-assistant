from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from config.database import connect_to_mongo, close_mongo_connection, get_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title="Analysis Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    try:
        db = get_database()
        # Test MongoDB connection
        await db.command("ping")
        
        return {
            "status": "ok",
            "service": "analysis-service",
            "database": "connected"
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
        "message": "Analysis Service API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)