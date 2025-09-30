from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://dev:devpass123@mongodb:27017/")
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