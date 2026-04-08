from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
import random
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/parcels", tags=["parcels"])


class Address(BaseModel):
    name: str
    phone: str
    address: str


class CreateParcel(BaseModel):
    sender: Address
    receiver: Address
    weight_kg: float
    description: str
    priority: str = "standard"  # standard, express, same_day
    distance_km: float = 10.0


class AssignDriver(BaseModel):
    driver_id: str


class UpdateStatus(BaseModel):
    status: str
    location: str = ""
    notes: str = ""


class ProofOfDelivery(BaseModel):
    receiver_name: str
    signature: str = ""
    photo: str = ""


def generate_tracking_number():
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y%m%d")
    rand = random.randint(1000, 9999)
    return f"TRK-{date_str}-{rand}"


async def calculate_charge(weight_kg: float, priority: str, distance_km: float) -> dict:
    settings = {}
    async for s in db.settings.find():
        settings[s["key"]] = float(s["value"]) if s["value"].replace(".", "").isdigit() else s["value"]

    base = settings.get("base_charge", 50)
    weight_charge = weight_kg * settings.get("per_kg_charge", 20)
    distance_charge = distance_km * settings.get("per_km_charge", 5)

    priority_multiplier = {"standard": 1.0, "express": 1.5, "same_day": 2.5}
    multiplier = priority_multiplier.get(priority, 1.0)
    priority_surcharge = (base + weight_charge + distance_charge) * (multiplier - 1)

    subtotal = base + weight_charge + distance_charge + priority_surcharge
    gst = round(subtotal * 0.18, 2)
    total = round(subtotal + gst, 2)

    return {
        "base_charge": base,
        "weight_charge": round(weight_charge, 2),
        "distance_charge": round(distance_charge, 2),
        "priority_surcharge": round(priority_surcharge, 2),
        "subtotal": round(subtotal, 2),
        "gst": gst,
        "total": total,
    }


@router.post("/")
async def create_parcel(data: CreateParcel, user: dict = Depends(get_current_user)):
    tracking_number = generate_tracking_number()
    # Ensure uniqueness
    while await db.parcels.find_one({"tracking_number": tracking_number}):
        tracking_number = generate_tracking_number()

    charges = await calculate_charge(data.weight_kg, data.priority, data.distance_km)
    now = datetime.now(timezone.utc)

    parcel = {
        "tracking_number": tracking_number,
        "sender": data.sender.model_dump(),
        "receiver": data.receiver.model_dump(),
        "weight_kg": data.weight_kg,
        "description": data.description,
        "priority": data.priority,
        "distance_km": data.distance_km,
        "charges": charges,
        "status": "booked",
        "driver_id": None,
        "proof_of_delivery": None,
        "tracking_events": [
            {
                "status": "booked",
                "timestamp": now.isoformat(),
                "location": data.sender.address,
                "notes": "Parcel booked",
            }
        ],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    result = await db.parcels.insert_one(parcel)
    parcel["_id"] = str(result.inserted_id)
    return parcel


@router.get("/")
async def list_parcels(
    status: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    user: dict = Depends(get_current_user),
):
    query = {}
    if status:
        query["status"] = status
    if q:
        query["$or"] = [
            {"tracking_number": {"$regex": q, "$options": "i"}},
            {"sender.phone": {"$regex": q}},
            {"receiver.phone": {"$regex": q}},
            {"sender.name": {"$regex": q, "$options": "i"}},
            {"receiver.name": {"$regex": q, "$options": "i"}},
        ]

    skip = (page - 1) * limit
    total = await db.parcels.count_documents(query)
    parcels = await db.parcels.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in parcels:
        p["_id"] = str(p["_id"])
    return {"parcels": parcels, "total": total, "page": page, "limit": limit}


@router.get("/stats")
async def parcel_stats(user: dict = Depends(get_current_user)):
    total = await db.parcels.count_documents({})
    in_transit = await db.parcels.count_documents({"status": "in_transit"})
    pending_pickup = await db.parcels.count_documents({"status": "booked"})

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    delivered_today = 0
    async for p in db.parcels.find({"status": "delivered"}):
        for evt in reversed(p.get("tracking_events", [])):
            if evt["status"] == "delivered" and evt["timestamp"].startswith(today):
                delivered_today += 1
                break

    # Status distribution
    statuses = ["booked", "picked_up", "in_transit", "out_for_delivery", "delivered", "returned"]
    distribution = {}
    for s in statuses:
        distribution[s] = await db.parcels.count_documents({"status": s})

    return {
        "total": total,
        "in_transit": in_transit,
        "delivered_today": delivered_today,
        "pending_pickup": pending_pickup,
        "distribution": distribution,
    }


@router.get("/track/{tracking_number}")
async def public_track(tracking_number: str):
    parcel = await db.parcels.find_one({"tracking_number": tracking_number})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return {
        "tracking_number": parcel["tracking_number"],
        "status": parcel["status"],
        "sender_name": parcel["sender"]["name"],
        "receiver_name": parcel["receiver"]["name"],
        "priority": parcel["priority"],
        "weight_kg": parcel["weight_kg"],
        "description": parcel["description"],
        "tracking_events": parcel["tracking_events"],
        "proof_of_delivery": parcel.get("proof_of_delivery"),
        "created_at": parcel["created_at"],
    }


@router.get("/{parcel_id}")
async def get_parcel(parcel_id: str, user: dict = Depends(get_current_user)):
    parcel = await db.parcels.find_one({"_id": ObjectId(parcel_id)})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    parcel["_id"] = str(parcel["_id"])
    if parcel.get("driver_id"):
        driver = await db.drivers.find_one({"_id": ObjectId(parcel["driver_id"])})
        if driver:
            parcel["driver"] = {"name": driver["name"], "phone": driver["phone"], "vehicle_number": driver.get("vehicle_number", "")}
    return parcel


@router.put("/{parcel_id}/assign-driver")
async def assign_driver(parcel_id: str, data: AssignDriver, user: dict = Depends(get_current_user)):
    parcel = await db.parcels.find_one({"_id": ObjectId(parcel_id)})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    driver = await db.drivers.find_one({"_id": ObjectId(data.driver_id)})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    await db.parcels.update_one(
        {"_id": ObjectId(parcel_id)},
        {"$set": {"driver_id": data.driver_id, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    await db.drivers.update_one({"_id": ObjectId(data.driver_id)}, {"$inc": {"current_parcels_count": 1}})
    return {"message": "Driver assigned"}


@router.put("/{parcel_id}/status")
async def update_parcel_status(parcel_id: str, data: UpdateStatus, user: dict = Depends(get_current_user)):
    valid = ["picked_up", "in_transit", "out_for_delivery", "delivered", "returned"]
    if data.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid}")

    parcel = await db.parcels.find_one({"_id": ObjectId(parcel_id)})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    now = datetime.now(timezone.utc)
    event = {
        "status": data.status,
        "timestamp": now.isoformat(),
        "location": data.location,
        "notes": data.notes,
    }

    update = {
        "$set": {"status": data.status, "updated_at": now.isoformat()},
        "$push": {"tracking_events": event},
    }

    await db.parcels.update_one({"_id": ObjectId(parcel_id)}, update)

    if data.status == "delivered" and parcel.get("driver_id"):
        await db.drivers.update_one(
            {"_id": ObjectId(parcel["driver_id"])},
            {"$inc": {"current_parcels_count": -1}},
        )

    return {"message": "Status updated", "event": event}


@router.put("/{parcel_id}/pod")
async def upload_pod(parcel_id: str, data: ProofOfDelivery, user: dict = Depends(get_current_user)):
    parcel = await db.parcels.find_one({"_id": ObjectId(parcel_id)})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")

    pod = {
        "receiver_name": data.receiver_name,
        "signature": data.signature,
        "photo": data.photo,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    await db.parcels.update_one(
        {"_id": ObjectId(parcel_id)},
        {"$set": {"proof_of_delivery": pod, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"message": "Proof of delivery recorded", "pod": pod}
