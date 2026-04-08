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

    # Email settings defaults
    email_defaults = [
        {"key": "smtp_host", "value": ""},
        {"key": "smtp_port", "value": "587"},
        {"key": "smtp_user", "value": ""},
        {"key": "smtp_pass", "value": ""},
        {"key": "smtp_from", "value": ""},
        {"key": "email_verification_enabled", "value": "true"},
        {"key": "email_welcome_enabled", "value": "true"},
        {"key": "email_password_reset_enabled", "value": "true"},
        {"key": "email_password_changed_enabled", "value": "true"},
        {"key": "require_email_verification", "value": "false"},
    ]
    for d in email_defaults:
        await db.settings.update_one({"key": d["key"]}, {"$setOnInsert": d}, upsert=True)

