from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/drivers", tags=["drivers"])


class CreateDriver(BaseModel):
    name: str
    phone: str
    email: str = ""
    vehicle_type: str = "bike"  # bike, van, truck
    vehicle_number: str = ""
    is_active: bool = True


class UpdateDriver(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    is_active: Optional[bool] = None


@router.post("/")
async def create_driver(data: CreateDriver, user: dict = Depends(get_current_user)):
    existing = await db.drivers.find_one({"phone": data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Driver with this phone already exists")

    driver = {
        **data.model_dump(),
        "current_parcels_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.drivers.insert_one(driver)
    driver["_id"] = str(result.inserted_id)
    return driver


@router.get("/")
async def list_drivers(user: dict = Depends(get_current_user)):
    drivers = await db.drivers.find().sort("name", 1).to_list(200)
    for d in drivers:
        d["_id"] = str(d["_id"])
    return drivers


@router.get("/available")
async def available_drivers(user: dict = Depends(get_current_user)):
    drivers = await db.drivers.find({"is_active": True}).sort("current_parcels_count", 1).to_list(200)
    for d in drivers:
        d["_id"] = str(d["_id"])
    return drivers


@router.get("/{driver_id}")
async def get_driver(driver_id: str, user: dict = Depends(get_current_user)):
    driver = await db.drivers.find_one({"_id": ObjectId(driver_id)})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    driver["_id"] = str(driver["_id"])

    # Get assigned parcels
    parcels = await db.parcels.find(
        {"driver_id": driver_id, "status": {"$nin": ["delivered", "returned"]}}
    ).to_list(50)
    for p in parcels:
        p["_id"] = str(p["_id"])
    driver["assigned_parcels"] = parcels
    return driver


@router.put("/{driver_id}")
async def update_driver(driver_id: str, data: UpdateDriver, user: dict = Depends(get_current_user)):
    driver = await db.drivers.find_one({"_id": ObjectId(driver_id)})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.drivers.update_one({"_id": ObjectId(driver_id)}, {"$set": updates})
    driver = await db.drivers.find_one({"_id": ObjectId(driver_id)})
    driver["_id"] = str(driver["_id"])
    return driver


@router.delete("/{driver_id}")
async def delete_driver(driver_id: str, user: dict = Depends(get_current_user)):
    result = await db.drivers.delete_one({"_id": ObjectId(driver_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver deleted"}
