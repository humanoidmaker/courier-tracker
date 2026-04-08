from fastapi import APIRouter, HTTPException
from database import db

router = APIRouter(prefix="/api/tracking", tags=["tracking"])


@router.get("/{tracking_number}")
async def track_parcel(tracking_number: str):
    """Public tracking endpoint - no auth required."""
    parcel = await db.parcels.find_one({"tracking_number": tracking_number})
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return {
        "tracking_number": parcel["tracking_number"],
        "status": parcel["status"],
        "priority": parcel["priority"],
        "sender_name": parcel["sender"]["name"],
        "sender_city": parcel["sender"]["address"].split(",")[-1].strip() if "," in parcel["sender"]["address"] else parcel["sender"]["address"],
        "receiver_name": parcel["receiver"]["name"],
        "receiver_city": parcel["receiver"]["address"].split(",")[-1].strip() if "," in parcel["receiver"]["address"] else parcel["receiver"]["address"],
        "weight_kg": parcel["weight_kg"],
        "description": parcel["description"],
        "tracking_events": parcel.get("tracking_events", []),
        "proof_of_delivery": parcel.get("proof_of_delivery"),
        "created_at": parcel["created_at"],
    }
