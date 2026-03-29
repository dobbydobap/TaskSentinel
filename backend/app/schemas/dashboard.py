from datetime import datetime

from pydantic import BaseModel

from app.schemas.activity import ActivityResponse


class StatusCounts(BaseModel):
    todo: int = 0
    in_progress: int = 0
    done: int = 0
    cancelled: int = 0


class RiskCounts(BaseModel):
    red: int = 0
    yellow: int = 0
    green: int = 0


class DashboardSummary(BaseModel):
    total: int
    by_status: StatusCounts
    by_risk: RiskCounts
    overdue_count: int
    productivity_score: float


class RiskTrendPoint(BaseModel):
    snapshot_at: datetime
    red_count: int
    yellow_count: int
    green_count: int
    total_tasks: int


class RiskTrendResponse(BaseModel):
    trend: list[RiskTrendPoint]


class RecentActivityResponse(BaseModel):
    activities: list[ActivityResponse]


class QuoteResponse(BaseModel):
    text: str
    author: str


class StreakResponse(BaseModel):
    current_streak: int
    message: str


class CalendarStreakResponse(BaseModel):
    current_streak: int
    message: str
    active_dates: list[str]
    year: int
    month: int


class SweepResponse(BaseModel):
    tasks_checked: int
    risks_changed: int
    snapshot_id: int
    email_alerts: list[dict]
