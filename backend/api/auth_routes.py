from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from database import db
from auth import verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_token({"sub": user["email"], "role": user.get("role", "user")})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "user"),
        },
    }


@router.get("/me")
async def me(user: dict = __import__("fastapi").Depends(__import__("auth").get_current_user)):
    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "user"),
    }
