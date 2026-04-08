from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.core.database import get_db
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/drivers", tags=["drivers"])

def s(doc):
    if doc: doc["id"] = str(doc.pop("_id"))
    return doc

@router.get("/")
async def list_drivers(db=Depends(get_db), user=Depends(get_current_user)):
    docs = await db.drivers.find({"is_active": {"$ne": False}}).sort("name", 1).to_list(100)
    return {"success": True, "drivers": [s(d) for d in docs]}

@router.get("/available")
async def available(db=Depends(get_db), user=Depends(get_current_user)):
    docs = await db.drivers.find({"is_active": True}).to_list(100)
    result = []
    for d in docs:
        active = await db.parcels.count_documents({"driver_id": str(d["_id"]), "status": {"$in": ["picked_up", "in_transit", "out_for_delivery"]}})
        d["active_parcels"] = active
        result.append(s(d))
    return {"success": True, "drivers": result}

@router.post("/")
async def create(data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    data.setdefault("is_active", True)
    r = await db.drivers.insert_one(data)
    return {"success": True, "id": str(r.inserted_id)}

@router.put("/{did}")
async def update(did: str, data: dict, user=Depends(get_current_user), db=Depends(get_db)):
    data.pop("id", None); data.pop("_id", None)
    await db.drivers.update_one({"_id": ObjectId(did)}, {"$set": data})
    return {"success": True}

@router.delete("/{did}")
async def delete(did: str, user=Depends(get_current_user), db=Depends(get_db)):
    await db.drivers.update_one({"_id": ObjectId(did)}, {"$set": {"is_active": False}})
    return {"success": True}
