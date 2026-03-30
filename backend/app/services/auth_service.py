import uuid
from datetime import timedelta, timezone, datetime

import bcrypt
from jose import JWTError, jwt
from pymongo.database import Database

from app.config import settings
from app.utils.time_helpers import utc_now


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def register_user(db: Database, email: str, password: str, name: str) -> dict:
    now = utc_now()
    user = {
        "_id": str(uuid.uuid4()),
        "email": email,
        "hashed_password": hash_password(password),
        "name": name,
        "phone": None,
        "created_at": now,
    }
    db.users.insert_one(user)
    return user


def authenticate_user(db: Database, email: str, password: str) -> dict | None:
    user = db.users.find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        return None
    return user


def get_user_by_id(db: Database, user_id: str) -> dict | None:
    return db.users.find_one({"_id": user_id})


def get_user_by_email(db: Database, email: str) -> dict | None:
    return db.users.find_one({"email": email})
