from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "courier_tracker"
    jwt_secret: str = "change-this-to-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24
    admin_email: str = "admin@courier.local"
    admin_password: str = "admin123"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
