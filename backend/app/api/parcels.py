from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone
from app.core.database import get_db
from app.utils.auth import get_current_user
import random, string

router = APIRouter(prefix="/api/parcels", tags=["parcels"])

def s(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc

def gen_tracking():
    now = datetime.now(timezone.utc)
    rand = ''.join(random.choices(string.digits, k=4))
    return f"TRK-{now.strftime('%Y%m%d')}-{rand}"

def calc_charge(weight_kg, priority):
    base = 50
    weight_charge = weight_kg * 20
    priority_mult = {"standard": 1, "express": 1.5, "same_day": 2.5}.get(priority, 1)
    subtotal = (base + weight_charge) * priority_mult
    gst = round(subtotal * 0.18, 2)
    return {"base": base, "weight_charge": round(weight_charge, 2), "priority_multiplier": priority_mult, "subtotal": round(subtotal, 2), "gst": gst, "total": round(subtotal + gst, 2)}

@router.post("/")
async def create_parcel(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    weight = data.get("weight_kg", 1)
    priority = data.get("priority", "standard")
    charges = calc_charge(weight, priority)
    now = datetime.now(timezone.utc)
    tracking = gen_tracking()

    parcel = {
        "tracking_number": tracking,
        "sender": data.get("sender", {}),
        "receiver": data.get("receiver", {}),
        "sender_phone": data.get("sender", {}).get("phone", ""),
        "receiver_phone": data.get("receiver", {}).get("phone", ""),
        "weight_kg": weight,
        "description": data.get("description", ""),
        "priority": priority,
        "charges": charges,
        "status": "booked",
        "driver_id": None,
        "tracking_events": [{"status": "booked", "timestamp": now.isoformat(), "location": "Pickup Point", "notes": "Parcel booked"}],
        "pod": None,
        "created_at": now,
    }
    r = await db.parcels.insert_one(parcel)
    parcel["id"] = str(r.inserted_id)
    del parcel["_id"]
    return {"success": True, "parcel": parcel, "tracking_number": tracking}

@router.get("/")
async def list_parcels(status: str = "", q: str = "", db=Depends(get_db), user=Depends(get_current_user)):
    f = {}
    if status:
        f["status"] = status
    if q:
        f["$or"] = [{"tracking_number": {"$regex": q, "$options": "i"}}, {"sender_phone": {"$regex": q}}, {"receiver_phone": {"$regex": q}}, {"sender.name": {"$regex": q, "$options": "i"}}, {"receiver.name": {"$regex": q, "$options": "i"}}]
    docs = await db.parcels.find(f).sort("created_at", -1).to_list(500)
    return {"success": True, "parcels": [s(d) for d in docs]}

@router.get("/track/{tracking_number}")
async def track_public(tracking_number: str, db=Depends(get_db)):
    """Public endpoint — no auth required"""
    doc = await db.parcels.find_one({"tracking_number": tracking_number.upper()})
    if not doc:
        raise HTTPException(404, "Parcel not found")
    return {
        "success": True,
        "tracking_number": doc["tracking_number"],
        "status": doc["status"],
        "sender": {"name": doc.get("sender", {}).get("name", ""), "city": doc.get("sender", {}).get("city", "")},
        "receiver": {"name": doc.get("receiver", {}).get("name", ""), "city": doc.get("receiver", {}).get("city", "")},
        "weight_kg": doc.get("weight_kg"),
        "priority": doc.get("priority"),
        "events": doc.get("tracking_events", []),
        "created_at": doc.get("created_at"),
    }

@router.get("/{pid}")
async def get_parcel(pid: str, db=Depends(get_db), user=Depends(get_current_user)):
    doc = await db.parcels.find_one({"_id": ObjectId(pid)})
    if not doc:
        raise HTTPException(404, "Not found")
    return {"success": True, "parcel": s(doc)}

@router.put("/{pid}/assign-driver")
async def assign_driver(pid: str, data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    await db.parcels.update_one({"_id": ObjectId(pid)}, {"$set": {"driver_id": data["driver_id"]}})
    return {"success": True}

@router.put("/{pid}/status")
async def update_status(pid: str, data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    new_status = data["status"]
    event = {
        "status": new_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "location": data.get("location", ""),
        "notes": data.get("notes", ""),
    }
    await db.parcels.update_one(
        {"_id": ObjectId(pid)},
        {"$set": {"status": new_status}, "$push": {"tracking_events": event}}
    )
    return {"success": True}

@router.put("/{pid}/pod")
async def proof_of_delivery(pid: str, data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    pod = {
        "receiver_name": data.get("receiver_name", ""),
        "signature": data.get("signature", ""),
        "photo": data.get("photo", ""),
        "delivered_at": datetime.now(timezone.utc).isoformat(),
    }
    event = {"status": "delivered", "timestamp": pod["delivered_at"], "location": "Destination", "notes": f"Received by {pod['receiver_name']}"}
    await db.parcels.update_one(
        {"_id": ObjectId(pid)},
        {"$set": {"status": "delivered", "pod": pod}, "$push": {"tracking_events": event}}
    )
    return {"success": True}

@router.get("/stats/overview")
async def stats(db=Depends(get_db), user=Depends(get_current_user)):
    total = await db.parcels.count_documents({})
    now = datetime.now(timezone.utc)
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    delivered_today = await db.parcels.count_documents({"status": "delivered", "created_at": {"$gte": start}})
    in_transit = await db.parcels.count_documents({"status": {"$in": ["picked_up", "in_transit", "out_for_delivery"]}})
    pending = await db.parcels.count_documents({"status": "booked"})
    return {"success": True, "stats": {"total_parcels": total, "delivered_today": delivered_today, "in_transit": in_transit, "pending_pickup": pending}}
