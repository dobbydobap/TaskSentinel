import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from app.database import get_db
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

# Load quotes once at startup
_quotes_path = Path(__file__).parent.parent / "data" / "quotes.json"
_quotes: list[dict] = []
if _quotes_path.exists():
    _quotes = json.loads(_quotes_path.read_text(encoding="utf-8"))


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    tasks = list(db.tasks.find({"user_id": current_user["_id"]}))
    total = len(tasks)
    now = utc_now()

    by_status = StatusCounts()
    by_risk = RiskCounts()
    overdue_count = 0

    for t in tasks:
        s = t["status"]
        if s == "todo":
            by_status.todo += 1
        elif s == "in_progress":
            by_status.in_progress += 1
        elif s == "done":
            by_status.done += 1
        elif s == "cancelled":
            by_status.cancelled += 1

        r = t.get("risk_level", "green")
        if r == "red":
            by_risk.red += 1
        elif r == "yellow":
            by_risk.yellow += 1
        else:
            by_risk.green += 1

        dl = t.get("deadline")
        if dl and dl < now and s not in ("done", "cancelled"):
            overdue_count += 1

    active = [t for t in tasks if t["status"] not in ("done", "cancelled")]
    if active:
        green_active = sum(1 for t in active if t.get("risk_level") == "green")
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
    db: Database = Depends(get_db),
    _current_user: dict = Depends(get_current_user),
):
    since = utc_now() - timedelta(days=days)
    snapshots = list(
        db.risk_snapshots.find({"snapshot_at": {"$gte": since}})
        .sort("snapshot_at", 1)
    )
    return RiskTrendResponse(
        trend=[
            RiskTrendPoint(
                snapshot_at=s["snapshot_at"],
                red_count=s["red_count"],
                yellow_count=s["yellow_count"],
                green_count=s["green_count"],
                total_tasks=s["total_tasks"],
            )
            for s in snapshots
        ]
    )


@router.get("/recent-activity", response_model=RecentActivityResponse)
def get_recent_activity(
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task_ids = [t["_id"] for t in db.tasks.find({"user_id": current_user["_id"]}, {"_id": 1})]
    activities = list(
        db.activity_log.find({"task_id": {"$in": task_ids}})
        .sort("created_at", -1)
        .limit(20)
    )
    return RecentActivityResponse(
        activities=[
            ActivityResponse(
                id=str(a["_id"]),
                task_id=a["task_id"],
                action=a["action"],
                detail=a.get("detail"),
                created_at=a["created_at"],
            )
            for a in activities
        ]
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
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    now = utc_now()
    streak = 0
    check_date = now.date()

    while True:
        day_start = datetime(check_date.year, check_date.month, check_date.day)
        day_end = day_start + timedelta(days=1)

        count = db.tasks.count_documents({
            "user_id": current_user["_id"],
            "completed_at": {"$gte": day_start, "$lt": day_end},
        })

        if count > 0:
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
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    now = utc_now()
    target_year = year or now.year
    target_month = month or now.month

    month_start = datetime(target_year, target_month, 1)
    if target_month == 12:
        month_end = datetime(target_year + 1, 1, 1)
    else:
        month_end = datetime(target_year, target_month + 1, 1)

    completed_tasks = list(db.tasks.find({
        "user_id": current_user["_id"],
        "completed_at": {"$gte": month_start, "$lt": month_end},
    }))

    active_dates: set[str] = set()
    for t in completed_tasks:
        if t.get("completed_at"):
            active_dates.add(t["completed_at"].strftime("%Y-%m-%d"))

    # Calculate streak
    streak = 0
    check_date = now.date()
    while True:
        day_start = datetime(check_date.year, check_date.month, check_date.day)
        day_end = day_start + timedelta(days=1)
        count = db.tasks.count_documents({
            "user_id": current_user["_id"],
            "completed_at": {"$gte": day_start, "$lt": day_end},
        })
        if count > 0:
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
