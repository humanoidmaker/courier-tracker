from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings

settings = get_settings()
client = AsyncIOMotorClient(settings.mongodb_uri)
db = client[settings.database_name]


async def init_db():
    # Create indexes
    await db.parcels.create_index("tracking_number", unique=True)
    await db.parcels.create_index("sender.phone")
    await db.parcels.create_index("receiver.phone")
    await db.drivers.create_index("phone", unique=True)
    await db.users.create_index("email", unique=True)

    # Seed default settings
    existing = await db.settings.find_one({"key": "company_name"})
    if not existing:
        defaults = [
            {"key": "company_name", "value": "TrackShip Logistics"},
            {"key": "base_charge", "value": "50"},
            {"key": "per_kg_charge", "value": "20"},
            {"key": "per_km_charge", "value": "5"},
            {"key": "sms_enabled", "value": "false"},
            {"key": "company_phone", "value": ""},
            {"key": "company_email", "value": ""},
            {"key": "company_address", "value": ""},
        ]
        await db.settings.insert_many(defaults)

    # Seed admin user
    from auth import hash_password
    existing_admin = await db.users.find_one({"email": settings.admin_email})
    if not existing_admin:
        await db.users.insert_one({
            "email": settings.admin_email,
            "password": hash_password(settings.admin_password),
            "name": "Admin",
            "role": "admin",
        })
