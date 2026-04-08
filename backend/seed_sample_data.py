"""Seed sample data for TrackShip."""
import asyncio
import random
from datetime import datetime, timedelta, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from config import get_settings
from auth import hash_password

settings = get_settings()
client = AsyncIOMotorClient(settings.mongodb_uri)
db = client[settings.database_name]

DRIVERS = [
    {"name": "Rajesh Kumar", "phone": "9876543210", "email": "rajesh@trackship.in", "vehicle_type": "bike", "vehicle_number": "DL-01-AB-1234", "is_active": True, "current_parcels_count": 0},
    {"name": "Suresh Yadav", "phone": "9876543211", "email": "suresh@trackship.in", "vehicle_type": "van", "vehicle_number": "DL-02-CD-5678", "is_active": True, "current_parcels_count": 0},
    {"name": "Amit Sharma", "phone": "9876543212", "email": "amit@trackship.in", "vehicle_type": "bike", "vehicle_number": "MH-01-EF-9012", "is_active": True, "current_parcels_count": 0},
    {"name": "Pradeep Singh", "phone": "9876543213", "email": "pradeep@trackship.in", "vehicle_type": "van", "vehicle_number": "KA-01-GH-3456", "is_active": True, "current_parcels_count": 0},
    {"name": "Vikram Patel", "phone": "9876543214", "email": "vikram@trackship.in", "vehicle_type": "bike", "vehicle_number": "TN-01-IJ-7890", "is_active": True, "current_parcels_count": 0},
]

CITIES = [
    "Connaught Place, New Delhi",
    "Andheri West, Mumbai",
    "Koramangala, Bangalore",
    "T Nagar, Chennai",
    "Salt Lake, Kolkata",
    "Banjara Hills, Hyderabad",
    "Aundh, Pune",
    "Vastrapur, Ahmedabad",
    "Gomti Nagar, Lucknow",
    "Malviya Nagar, Jaipur",
]

NAMES = [
    "Arun Mehta", "Priya Verma", "Kiran Desai", "Ravi Gupta", "Neha Joshi",
    "Sanjay Tiwari", "Meena Iyer", "Deepak Nair", "Anita Reddy", "Manoj Pillai",
    "Sneha Kulkarni", "Rahul Bhatt", "Pooja Saxena", "Ajay Chauhan", "Divya Mishra",
]

DESCRIPTIONS = [
    "Electronics - Mobile Phone", "Documents - Legal Papers", "Clothing - Garments",
    "Books - Academic", "Medicine - Pharmacy", "Food - Dry Goods",
    "Jewelry - Gold Set", "Laptop - Dell", "Home Decor - Vase Set",
    "Kitchenware - Steel Utensils", "Cosmetics - Beauty Kit", "Toys - Board Games",
    "Stationery - Office Supplies", "Footwear - Shoes", "Gift - Birthday Package",
]

STATUSES_ORDER = ["booked", "picked_up", "in_transit", "out_for_delivery", "delivered"]


def random_phone():
    return f"98{random.randint(10000000, 99999999)}"


def random_tracking():
    d = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))
    return f"TRK-{d.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"


async def seed():
    # Clear existing data
    await db.parcels.delete_many({})
    await db.drivers.delete_many({})
    await db.users.delete_many({})
    await db.settings.delete_many({})

    # Seed admin
    await db.users.insert_one({
        "email": settings.admin_email,
        "password": hash_password(settings.admin_password),
        "name": "Admin",
        "role": "admin",
    })

    # Seed settings
    defaults = [
        {"key": "company_name", "value": "TrackShip Logistics"},
        {"key": "base_charge", "value": "50"},
        {"key": "per_kg_charge", "value": "20"},
        {"key": "per_km_charge", "value": "5"},
        {"key": "sms_enabled", "value": "false"},
        {"key": "company_phone", "value": "+91-11-23456789"},
        {"key": "company_email", "value": "info@trackship.in"},
        {"key": "company_address", "value": "42, Logistics Park, Okhla Phase 2, New Delhi - 110020"},
    ]
    await db.settings.insert_many(defaults)

    # Seed drivers
    driver_ids = []
    for d in DRIVERS:
        d["created_at"] = datetime.now(timezone.utc).isoformat()
        d["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await db.drivers.insert_one(d)
        driver_ids.append(str(result.inserted_id))

    # Seed parcels
    # 10 delivered, 8 in_transit, 5 out_for_delivery, 4 picked_up, 3 booked
    status_counts = [
        ("delivered", 10),
        ("in_transit", 8),
        ("out_for_delivery", 5),
        ("picked_up", 4),
        ("booked", 3),
    ]

    tracking_numbers = set()
    for target_status, count in status_counts:
        for _ in range(count):
            tn = random_tracking()
            while tn in tracking_numbers:
                tn = random_tracking()
            tracking_numbers.add(tn)

            weight = round(random.uniform(0.5, 25.0), 1)
            priority = random.choice(["standard", "express", "same_day"])
            distance = round(random.uniform(5, 500), 1)

            base = 50
            wc = weight * 20
            dc = distance * 5
            mult = {"standard": 1.0, "express": 1.5, "same_day": 2.5}[priority]
            ps = (base + wc + dc) * (mult - 1)
            sub = base + wc + dc + ps
            gst = round(sub * 0.18, 2)
            total = round(sub + gst, 2)

            sender_idx = random.randint(0, len(NAMES) - 1)
            receiver_idx = random.randint(0, len(NAMES) - 1)
            while receiver_idx == sender_idx:
                receiver_idx = random.randint(0, len(NAMES) - 1)

            created = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30), hours=random.randint(0, 23))
            driver_id = random.choice(driver_ids) if target_status != "booked" else None

            # Build tracking events
            status_idx = STATUSES_ORDER.index(target_status)
            events = []
            event_time = created
            for i in range(status_idx + 1):
                s = STATUSES_ORDER[i]
                notes_map = {
                    "booked": "Parcel booked",
                    "picked_up": "Picked up by driver",
                    "in_transit": "In transit to destination city",
                    "out_for_delivery": "Out for delivery",
                    "delivered": "Delivered successfully",
                }
                events.append({
                    "status": s,
                    "timestamp": event_time.isoformat(),
                    "location": random.choice(CITIES),
                    "notes": notes_map[s],
                })
                event_time += timedelta(hours=random.randint(2, 12))

            pod = None
            if target_status == "delivered":
                pod = {
                    "receiver_name": NAMES[receiver_idx],
                    "signature": "",
                    "photo": "",
                    "timestamp": events[-1]["timestamp"],
                }

            parcel = {
                "tracking_number": tn,
                "sender": {"name": NAMES[sender_idx], "phone": random_phone(), "address": random.choice(CITIES)},
                "receiver": {"name": NAMES[receiver_idx], "phone": random_phone(), "address": random.choice(CITIES)},
                "weight_kg": weight,
                "description": random.choice(DESCRIPTIONS),
                "priority": priority,
                "distance_km": distance,
                "charges": {
                    "base_charge": base,
                    "weight_charge": round(wc, 2),
                    "distance_charge": round(dc, 2),
                    "priority_surcharge": round(ps, 2),
                    "subtotal": round(sub, 2),
                    "gst": gst,
                    "total": total,
                },
                "status": target_status,
                "driver_id": driver_id,
                "proof_of_delivery": pod,
                "tracking_events": events,
                "created_at": created.isoformat(),
                "updated_at": event_time.isoformat(),
            }
            await db.parcels.insert_one(parcel)

    # Update driver parcel counts
    for did in driver_ids:
        count = await db.parcels.count_documents({"driver_id": did, "status": {"$nin": ["delivered", "returned"]}})
        await db.drivers.update_one({"_id": __import__("bson").ObjectId(did)}, {"$set": {"current_parcels_count": count}})

    # Create indexes
    await db.parcels.create_index("tracking_number", unique=True)
    await db.parcels.create_index("sender.phone")
    await db.parcels.create_index("receiver.phone")
    await db.drivers.create_index("phone", unique=True)
    await db.users.create_index("email", unique=True)

    print("Seeded: 1 admin, 5 drivers, 30 parcels, settings")


if __name__ == "__main__":
    asyncio.run(seed())
