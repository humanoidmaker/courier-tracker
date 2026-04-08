import asyncio, sys, random
from datetime import datetime, timezone, timedelta
sys.path.insert(0, ".")
from app.core.database import init_db, get_db

CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"]
NAMES = ["Aarav Sharma", "Diya Patel", "Vihaan Reddy", "Ananya Nair", "Arjun Desai", "Ishita Gupta", "Kabir Singh", "Myra Joshi", "Reyansh Verma", "Saanvi Pillai", "Dhruv Kumar", "Kiara Bhat", "Aditya Rao", "Navya Iyer", "Vivaan Menon", "Siya Das", "Krishna Kapoor", "Riya Nair", "Ayan Mehta", "Nisha Verma"]

STATUS_FLOW = {
    "delivered": ["booked", "picked_up", "in_transit", "out_for_delivery", "delivered"],
    "in_transit": ["booked", "picked_up", "in_transit"],
    "out_for_delivery": ["booked", "picked_up", "in_transit", "out_for_delivery"],
    "picked_up": ["booked", "picked_up"],
    "booked": ["booked"],
}

async def seed():
    await init_db()
    db = await get_db()
    if await db.parcels.count_documents({}) > 0:
        print("Data exists"); return

    # Drivers
    drivers = []
    for name, vehicle in [("Ramesh Kumar", "bike"), ("Suresh Yadav", "van"), ("Mahesh Sharma", "bike"), ("Rajesh Verma", "van"), ("Dinesh Patel", "truck")]:
        r = await db.drivers.insert_one({"name": name, "phone": f"987654{random.randint(1000,9999)}", "email": f"{name.split()[0].lower()}@courier.local", "vehicle_type": vehicle, "vehicle_number": f"MH{random.randint(1,50):02d}{random.choice('ABCDEFGH')}{random.randint(1000,9999)}", "is_active": True})
        drivers.append(str(r.inserted_id))

    now = datetime.now(timezone.utc)
    statuses = ["delivered"]*10 + ["in_transit"]*8 + ["out_for_delivery"]*5 + ["picked_up"]*4 + ["booked"]*3

    for i, final_status in enumerate(statuses):
        weight = round(random.uniform(0.5, 15), 1)
        priority = random.choice(["standard", "standard", "express", "same_day"])
        base = 50; wc = weight * 20; pm = {"standard": 1, "express": 1.5, "same_day": 2.5}[priority]
        subtotal = round((base + wc) * pm, 2); gst = round(subtotal * 0.18, 2)

        sender_city = random.choice(CITIES)
        receiver_city = random.choice([c for c in CITIES if c != sender_city])
        day_offset = random.randint(0, 10)
        created = now - timedelta(days=day_offset, hours=random.randint(0, 12))

        # Build tracking events
        flow = STATUS_FLOW[final_status]
        events = []
        for j, st in enumerate(flow):
            t = created + timedelta(hours=j * random.randint(2, 8))
            loc = sender_city if j < 2 else ("In Transit Hub" if j == 2 else receiver_city)
            notes = {"booked": "Parcel booked", "picked_up": "Picked up from sender", "in_transit": "At sorting facility", "out_for_delivery": "Out for delivery", "delivered": "Delivered successfully"}
            events.append({"status": st, "timestamp": t.isoformat(), "location": loc, "notes": notes.get(st, "")})

        pod = None
        if final_status == "delivered":
            pod = {"receiver_name": random.choice(NAMES), "delivered_at": events[-1]["timestamp"]}

        await db.parcels.insert_one({
            "tracking_number": f"TRK-{created.strftime('%Y%m%d')}-{1000+i}",
            "sender": {"name": NAMES[i % len(NAMES)], "phone": f"987650{i:04d}", "address": f"{random.randint(1,500)} Main Road, {sender_city}", "city": sender_city},
            "receiver": {"name": NAMES[(i+5) % len(NAMES)], "phone": f"987660{i:04d}", "address": f"{random.randint(1,500)} Market Street, {receiver_city}", "city": receiver_city},
            "sender_phone": f"987650{i:04d}", "receiver_phone": f"987660{i:04d}",
            "weight_kg": weight, "description": random.choice(["Documents", "Electronics", "Clothing", "Books", "Gift Package", "Machine Parts", "Food Items", "Medicine"]),
            "priority": priority,
            "charges": {"base": base, "weight_charge": round(wc, 2), "subtotal": subtotal, "gst": gst, "total": round(subtotal + gst, 2)},
            "status": final_status,
            "driver_id": random.choice(drivers) if final_status != "booked" else None,
            "tracking_events": events, "pod": pod, "created_at": created,
        })

    print(f"Seeded: 5 drivers, {len(statuses)} parcels with tracking events")

asyncio.run(seed())
