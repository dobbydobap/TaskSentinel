import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity import ActivityLog
from app.models.risk_snapshot import RiskSnapshot
from app.models.task import Task
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.activity import ActivityResponse
from app.schemas.dashboard import (
    CalendarStreakResponse,
    DashboardSummary,
    QuoteResponse,
    RecentActivityResponse,
    RiskCounts,
    RiskTrendPoint,
    RiskTrendResponse,
    StatusCounts,
    StreakResponse,
)
from app.utils.time_helpers import utc_now

router = APIRouter()


def _make_naive(dt: datetime | None) -> datetime | None:
    """Strip timezone info for safe comparison with naive datetimes."""
    if dt is None:
        return None
    return dt.replace(tzinfo=None) if dt.tzinfo else dt

# Load quotes once at startup
_quotes_path = Path(__file__).parent.parent / "data" / "quotes.json"
_quotes: list[dict] = []
if _quotes_path.exists():
    _quotes = json.loads(_quotes_path.read_text(encoding="utf-8"))


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    total = len(tasks)

    by_status = StatusCounts()
    by_risk = RiskCounts()
    overdue_count = 0
    now = utc_now()

    for t in tasks:
        # Count by status
        if t.status == "todo":
            by_status.todo += 1
        elif t.status == "in_progress":
            by_status.in_progress += 1
        elif t.status == "done":
            by_status.done += 1
        elif t.status == "cancelled":
            by_status.cancelled += 1

        # Count by risk
        if t.risk_level == "red":
            by_risk.red += 1
        elif t.risk_level == "yellow":
            by_risk.yellow += 1
        else:
            by_risk.green += 1

        # Overdue
        dl = _make_naive(t.deadline)
        if dl and dl < now and t.status not in ("done", "cancelled"):
            overdue_count += 1

    # Productivity score: % of active tasks that are green
    active = [t for t in tasks if t.status not in ("done", "cancelled")]
    if active:
        green_active = sum(1 for t in active if t.risk_level == "green")
        productivity_score = round((green_active / len(active)) * 100, 1)
    else:
        productivity_score = 100.0

    return DashboardSummary(
        total=total,
        by_status=by_status,
        by_risk=by_risk,
        overdue_count=overdue_count,
        productivity_score=productivity_score,
    )


@router.get("/risk-trend", response_model=RiskTrendResponse)
def get_risk_trend(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    since = utc_now() - timedelta(days=days)
    snapshots = (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.snapshot_at >= since)
        .order_by(RiskSnapshot.snapshot_at.asc())
        .all()
    )
    return RiskTrendResponse(
        trend=[
            RiskTrendPoint(
                snapshot_at=s.snapshot_at,
                red_count=s.red_count,
                yellow_count=s.yellow_count,
                green_count=s.green_count,
                total_tasks=s.total_tasks,
            )
            for s in snapshots
        ]
    )


@router.get("/recent-activity", response_model=RecentActivityResponse)
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activities = (
        db.query(ActivityLog)
        .join(ActivityLog.task)
        .filter(Task.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(20)
        .all()
    )
    return RecentActivityResponse(
        activities=[ActivityResponse.model_validate(a) for a in activities]
    )


@router.get("/quote", response_model=QuoteResponse)
def get_quote():
    if not _quotes:
        return QuoteResponse(
            text="The secret of getting ahead is getting started.",
            author="Mark Twain",
        )
    quote = random.choice(_quotes)
    return QuoteResponse(text=quote["text"], author=quote["author"])


@router.get("/streak", response_model=StreakResponse)
def get_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = utc_now()
    streak = 0
    check_date = now.date()

    while True:
        day_start = check_date
        day_end = check_date + timedelta(days=1)

        completed_today = (
            db.query(Task)
            .filter(
                Task.user_id == current_user.id,
                Task.completed_at.isnot(None),
                func.date(Task.completed_at) == day_start,
            )
            .count()
        )

        if completed_today > 0:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    if streak == 0:
        message = "Complete a task today to start your streak!"
    elif streak == 1:
        message = "Great start! Keep it going tomorrow!"
    elif streak < 7:
        message = f"You've been productive for {streak} days straight!"
    else:
        message = f"Incredible {streak}-day streak! You're unstoppable!"

    return StreakResponse(current_streak=streak, message=message)


@router.get("/calendar-streak", response_model=CalendarStreakResponse)
def get_calendar_streak(
    year: int | None = None,
    month: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = utc_now()
    target_year = year or now.year
    target_month = month or now.month

    # Get all completed tasks in this month
    month_start = datetime(target_year, target_month, 1)
    if target_month == 12:
        month_end = datetime(target_year + 1, 1, 1)
    else:
        month_end = datetime(target_year, target_month + 1, 1)

    completed_tasks = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.completed_at.isnot(None),
            Task.completed_at >= month_start,
            Task.completed_at < month_end,
        )
        .all()
    )

    # Collect unique dates with completions
    active_dates: set[str] = set()
    for t in completed_tasks:
        if t.completed_at:
            dt = _make_naive(t.completed_at) if t.completed_at else None
            if dt:
                active_dates.add(dt.strftime("%Y-%m-%d"))

    # Calculate streak (reuse logic)
    streak = 0
    check_date = now.date()
    while True:
        completed_today = (
            db.query(Task)
            .filter(
                Task.user_id == current_user.id,
                Task.completed_at.isnot(None),
                func.date(Task.completed_at) == check_date,
            )
            .count()
        )
        if completed_today > 0:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    if streak == 0:
        message = "Complete a task today to start your streak!"
    elif streak == 1:
        message = "Great start! Keep it going tomorrow!"
    elif streak < 7:
        message = f"{streak} day streak! Keep going!"
    else:
        message = f"Incredible {streak}-day streak!"

    return CalendarStreakResponse(
        current_streak=streak,
        message=message,
        active_dates=sorted(active_dates),
        year=target_year,
        month=target_month,
    )
