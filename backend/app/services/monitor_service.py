import json

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.risk_snapshot import RiskSnapshot
from app.models.task import Task
from app.services.risk_engine import compute_risk
from app.utils.time_helpers import utc_now


def run_sweep(db: Session) -> dict:
    """Run a full risk recalculation across all active tasks.
    Returns sweep results including email alert data."""
    active_tasks = (
        db.query(Task)
        .filter(Task.status.in_(["todo", "in_progress"]))
        .all()
    )

    risks_changed = 0
    email_alerts: list[dict] = []
    risk_counts = {"red": 0, "yellow": 0, "green": 0}

    for task in active_tasks:
        old_risk = task.risk_level
        new_risk = compute_risk(
            status=task.status,
            priority=task.priority,
            deadline=task.deadline,
            last_activity_at=task.last_activity_at,
        )

        risk_counts[new_risk] += 1

        if old_risk != new_risk:
            task.risk_level = new_risk
            risks_changed += 1

            # Create notification for risk escalation
            if new_risk == "red" or (old_risk == "green" and new_risk == "yellow"):
                reason = _get_risk_reason(task, new_risk)
                notification = Notification(
                    task_id=task.id,
                    type="risk_escalated" if new_risk == "red" else "due_soon",
                    message=reason,
                )
                db.add(notification)

                # Collect email alerts for tasks that just turned red
                if new_risk == "red":
                    email_alerts.append({
                        "task_title": task.title,
                        "reason": reason,
                        "deadline": task.deadline.isoformat() if task.deadline else None,
                    })

    # Count completed/cancelled tasks as green
    done_count = (
        db.query(Task)
        .filter(Task.status.in_(["done", "cancelled"]))
        .count()
    )
    risk_counts["green"] += done_count
    total_tasks = len(active_tasks) + done_count

    # Save risk snapshot
    snapshot = RiskSnapshot(
        red_count=risk_counts["red"],
        yellow_count=risk_counts["yellow"],
        green_count=risk_counts["green"],
        total_tasks=total_tasks,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return {
        "tasks_checked": len(active_tasks),
        "risks_changed": risks_changed,
        "snapshot_id": snapshot.id,
        "email_alerts": email_alerts,
    }


def _naive(dt):
    return dt.replace(tzinfo=None) if dt and dt.tzinfo else dt


def _get_risk_reason(task: Task, risk_level: str) -> str:
    now = utc_now()

    if task.deadline:
        hours_remaining = (_naive(task.deadline) - now).total_seconds() / 3600
        if hours_remaining <= 0:
            return f'"{task.title}" is overdue'
        if hours_remaining <= 24:
            return f'"{task.title}" is due in less than 24 hours'
        if hours_remaining <= 72:
            return f'"{task.title}" is due within 3 days'

    hours_inactive = (now - _naive(task.last_activity_at)).total_seconds() / 3600
    days_inactive = int(hours_inactive / 24)
    if days_inactive >= 2:
        return f'"{task.title}" has been inactive for {days_inactive} days'

    return f'"{task.title}" risk level changed to {risk_level}'
