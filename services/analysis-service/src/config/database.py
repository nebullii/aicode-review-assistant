from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is required")
DATABASE_NAME = "analysis_results"

class Database:
    client: AsyncIOMotorClient = None
    
db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(MONGODB_URL)
    print("✓ MongoDB connected")
    
async def close_mongo_connection():
    db.client.close()
    print("MongoDB connection closed")

def get_database():
    return db.client[DATABASE_NAME]