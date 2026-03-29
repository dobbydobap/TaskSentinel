from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.database import Database

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
)
from app.services.notification_service import (
    get_notifications,
    get_unread_count,
    mark_all_read,
    mark_read,
)

router = APIRouter()


def _notif_response(n: dict) -> NotificationResponse:
    return NotificationResponse(
        id=str(n["_id"]),
        task_id=n["task_id"],
        type=n["type"],
        message=n["message"],
        is_read=n["is_read"],
        created_at=n["created_at"],
    )


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    unread: bool = False,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    notifications, total = get_notifications(
        db, current_user["_id"], unread, page, size
    )
    return NotificationListResponse(
        notifications=[_notif_response(n) for n in notifications],
        total=total,
    )


@router.get("/count", response_model=UnreadCountResponse)
def unread_count(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    count = get_unread_count(db, current_user["_id"])
    return UnreadCountResponse(count=count)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def read_notification(
    notification_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    notification = mark_read(db, notification_id, current_user["_id"])
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return _notif_response(notification)


@router.post("/read-all")
def read_all(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    count = mark_all_read(db, current_user["_id"])
    return {"marked_read": count}
