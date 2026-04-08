from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = None
db = None

async def get_db():
    return db

async def init_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_name = settings.MONGODB_URI.rsplit("/", 1)[-1].split("?")[0] or "courier_tracker"
    db = client[db_name]
    await db.users.create_index("email", unique=True)
    await db.parcels.create_index("tracking_number", unique=True)
    await db.parcels.create_index("sender_phone")
    await db.parcels.create_index("receiver_phone")
    await db.drivers.create_index("phone", unique=True)
    if not await db.settings.find_one({"key": "company_name"}):
        await db.settings.insert_many([
            {"key": "company_name", "value": "TrackShip Courier"},
            {"key": "base_charge", "value": "50"},
            {"key": "per_kg_charge", "value": "20"},
            {"key": "per_km_charge", "value": "5"},
            {"key": "gst_rate", "value": "18"},
        ])
