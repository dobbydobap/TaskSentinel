from datetime import datetime

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: int
    task_id: str
    action: str
    detail: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityListResponse(BaseModel):
    activities: list[ActivityResponse]
    total: int
