from datetime import datetime

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: str
    task_id: str
    action: str
    detail: str | None
    created_at: datetime


class ActivityListResponse(BaseModel):
    activities: list[ActivityResponse]
    total: int
