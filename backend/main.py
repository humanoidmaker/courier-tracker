from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_db
from api.auth_routes import router as auth_router
from api.settings_routes import router as settings_router
from api.parcels import router as parcels_router
from api.drivers import router as drivers_router
from api.tracking import router as tracking_router
from api.charges import router as charges_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="TrackShip API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(parcels_router)
app.include_router(drivers_router)
app.include_router(tracking_router)
app.include_router(charges_router)


@app.get("/")
async def root():
    return {"app": "TrackShip", "version": "1.0.0"}


@app.get("/api/stats")
async def global_stats():
    from database import db
    from datetime import datetime, timezone

    total = await db.parcels.count_documents({})
    in_transit = await db.parcels.count_documents({"status": "in_transit"})
    delivered = await db.parcels.count_documents({"status": "delivered"})
    booked = await db.parcels.count_documents({"status": "booked"})
    drivers = await db.drivers.count_documents({"is_active": True})

    return {
        "total_parcels": total,
        "in_transit": in_transit,
        "delivered": delivered,
        "booked": booked,
        "active_drivers": drivers,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
