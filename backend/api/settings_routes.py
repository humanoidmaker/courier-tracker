from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from database import db
from auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingUpdate(BaseModel):
    key: str
    value: str


@router.get("/")
async def get_settings(user: dict = Depends(get_current_user)):
    settings = await db.settings.find().to_list(100)
    result = {}
    for s in settings:
        result[s["key"]] = s["value"]
    return result


@router.put("/")
async def update_settings(updates: list[SettingUpdate], user: dict = Depends(get_current_user)):
    for update in updates:
        await db.settings.update_one(
            {"key": update.key},
            {"$set": {"value": update.value}},
            upsert=True,
        )
    return {"message": "Settings updated"}


@router.get("/{key}")
async def get_setting(key: str):
    setting = await db.settings.find_one({"key": key})
    if setting:
        return {"key": key, "value": setting["value"]}
    return {"key": key, "value": None}
