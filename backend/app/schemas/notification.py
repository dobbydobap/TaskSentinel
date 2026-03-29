from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    task_id: str
    type: str
    message: str
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
    total: int


class UnreadCountResponse(BaseModel):
    count: int
