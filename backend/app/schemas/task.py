from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    priority: Literal["critical", "high", "medium", "low"] = "medium"
    status: Literal["todo", "in_progress", "done", "cancelled"] = "todo"
    tags: list[str] = []
    deadline: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    priority: Literal["critical", "high", "medium", "low"] | None = None
    status: Literal["todo", "in_progress", "done", "cancelled"] | None = None
    tags: list[str] | None = None
    deadline: datetime | None = None


class StatusUpdate(BaseModel):
    status: Literal["todo", "in_progress", "done", "cancelled"]


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str | None
    priority: str
    status: str
    risk_level: str
    tags: list[str]
    deadline: datetime | None
    last_activity_at: datetime
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    page: int
    size: int
