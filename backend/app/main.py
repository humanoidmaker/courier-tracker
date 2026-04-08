from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import init_db
from app.api import auth, parcels, drivers, settings as settings_api

@asynccontextmanager
async def lifespan(app):
    await init_db()
    yield

app = FastAPI(title="TrackShip Courier API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(parcels.router)
app.include_router(drivers.router)
app.include_router(settings_api.router)

# Public tracking endpoint (no auth)
@app.get("/api/track/{tracking_number}")
async def public_track(tracking_number: str):
    from app.core.database import get_db as gdb
    db = await gdb()
    doc = await db.parcels.find_one({"tracking_number": tracking_number.upper()})
    if not doc:
        return {"success": False, "error": "Parcel not found"}
    return {
        "success": True,
        "tracking_number": doc["tracking_number"],
        "status": doc["status"],
        "priority": doc.get("priority"),
        "events": doc.get("tracking_events", []),
    }

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "TrackShip Courier"}

@app.get("/api/stats")
async def stats():
    from app.core.database import get_db as gdb
    from datetime import datetime, timezone
    db = await gdb()
    total = await db.parcels.count_documents({})
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    delivered_today = await db.parcels.count_documents({"status": "delivered", "created_at": {"$gte": start}})
    in_transit = await db.parcels.count_documents({"status": {"$in": ["picked_up", "in_transit", "out_for_delivery"]}})
    pending = await db.parcels.count_documents({"status": "booked"})
    total_drivers = await db.drivers.count_documents({"is_active": True})
    return {"stats": {"total_parcels": total, "delivered_today": delivered_today, "in_transit": in_transit, "pending_pickup": pending, "total_drivers": total_drivers}}
