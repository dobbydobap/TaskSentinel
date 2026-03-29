from fastapi import APIRouter, Depends, HTTPException, Header, status
from pymongo.database import Database

from app.database import get_db
from app.schemas.auth import (
    LoginRequest,
    PasswordChange,
    ProfileUpdate,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_user_by_email,
    get_user_by_id,
    hash_password,
    register_user,
    verify_password,
)

router = APIRouter()


def _extract_token(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    return authorization[7:]


def get_current_user(
    db: Database = Depends(get_db),
    token: str = Depends(_extract_token),
) -> dict:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    user = get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


def _user_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["_id"],
        email=user["email"],
        name=user["name"],
        phone=user.get("phone"),
        created_at=user["created_at"],
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Database = Depends(get_db)):
    if get_user_by_email(db, data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )
    user = register_user(db, data.email, data.password, data.name)
    return TokenResponse(
        access_token=create_access_token(user["_id"]),
        refresh_token=create_refresh_token(user["_id"]),
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Database = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    return TokenResponse(
        access_token=create_access_token(user["_id"]),
        refresh_token=create_refresh_token(user["_id"]),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Database = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    user = get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return TokenResponse(
        access_token=create_access_token(user["_id"]),
        refresh_token=create_refresh_token(user["_id"]),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return _user_response(current_user)


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: ProfileUpdate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    updates: dict = {}
    if data.name is not None:
        updates["name"] = data.name
    if data.phone is not None:
        updates["phone"] = data.phone
    if data.email is not None and data.email != current_user["email"]:
        if get_user_by_email(db, data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already in use"
            )
        updates["email"] = data.email

    if updates:
        db.users.update_one({"_id": current_user["_id"]}, {"$set": updates})

    user = get_user_by_id(db, current_user["_id"])
    return _user_response(user)


@router.post("/change-password")
def change_password(
    data: PasswordChange,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"hashed_password": hash_password(data.new_password)}},
    )
    return {"message": "Password updated successfully"}
