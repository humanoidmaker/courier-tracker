from fastapi import APIRouter, Depends
from pydantic import BaseModel
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/charges", tags=["charges"])


class CalculateChargeRequest(BaseModel):
    weight_kg: float
    priority: str = "standard"
    distance_km: float = 10.0


@router.post("/calculate")
async def calculate_charge(data: CalculateChargeRequest, user: dict = Depends(get_current_user)):
    settings = {}
    async for s in db.settings.find():
        try:
            settings[s["key"]] = float(s["value"])
        except (ValueError, TypeError):
            settings[s["key"]] = s["value"]

    base = settings.get("base_charge", 50)
    weight_charge = data.weight_kg * settings.get("per_kg_charge", 20)
    distance_charge = data.distance_km * settings.get("per_km_charge", 5)

    priority_multiplier = {"standard": 1.0, "express": 1.5, "same_day": 2.5}
    multiplier = priority_multiplier.get(data.priority, 1.0)
    priority_surcharge = (base + weight_charge + distance_charge) * (multiplier - 1)

    subtotal = base + weight_charge + distance_charge + priority_surcharge
    gst = round(subtotal * 0.18, 2)
    total = round(subtotal + gst, 2)

    return {
        "base_charge": round(base, 2),
        "weight_charge": round(weight_charge, 2),
        "distance_charge": round(distance_charge, 2),
        "priority_surcharge": round(priority_surcharge, 2),
        "subtotal": round(subtotal, 2),
        "gst": gst,
        "total": total,
        "breakdown": {
            "base": f"Base charge: ₹{base}",
            "weight": f"Weight ({data.weight_kg} kg × ₹{settings.get('per_kg_charge', 20)}): ₹{round(weight_charge, 2)}",
            "distance": f"Distance ({data.distance_km} km × ₹{settings.get('per_km_charge', 5)}): ₹{round(distance_charge, 2)}",
            "priority": f"Priority surcharge ({data.priority}): ₹{round(priority_surcharge, 2)}",
            "gst": f"GST (18%): ₹{gst}",
            "total": f"Total: ₹{total}",
        },
    }
