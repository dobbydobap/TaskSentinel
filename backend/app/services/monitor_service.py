from pymongo.database import Database

from app.services.risk_engine import compute_risk
from app.utils.time_helpers import utc_now


def run_sweep(db: Database) -> dict:
    active_tasks = list(
        db.tasks.find({"status": {"$in": ["todo", "in_progress"]}})
    )

    risks_changed = 0
    email_alerts: list[dict] = []
    risk_counts = {"red": 0, "yellow": 0, "green": 0}

    for task in active_tasks:
        old_risk = task.get("risk_level", "green")
        new_risk = compute_risk(
            status=task["status"],
            priority=task["priority"],
            deadline=task.get("deadline"),
            last_activity_at=task["last_activity_at"],
        )

        risk_counts[new_risk] += 1

        if old_risk != new_risk:
            db.tasks.update_one(
                {"_id": task["_id"]},
                {"$set": {"risk_level": new_risk}},
            )
            risks_changed += 1

            if new_risk == "red" or (old_risk == "green" and new_risk == "yellow"):
                reason = _get_risk_reason(task, new_risk)
                db.notifications.insert_one({
                    "task_id": task["_id"],
                    "type": "risk_escalated" if new_risk == "red" else "due_soon",
                    "message": reason,
                    "is_read": False,
                    "created_at": utc_now(),
                })

                if new_risk == "red":
                    email_alerts.append({
                        "task_title": task["title"],
                        "reason": reason,
                        "deadline": task["deadline"].isoformat() if task.get("deadline") else None,
                    })

    done_count = db.tasks.count_documents({"status": {"$in": ["done", "cancelled"]}})
    risk_counts["green"] += done_count
    total_tasks = len(active_tasks) + done_count

    snapshot = {
        "snapshot_at": utc_now(),
        "red_count": risk_counts["red"],
        "yellow_count": risk_counts["yellow"],
        "green_count": risk_counts["green"],
        "total_tasks": total_tasks,
    }
    result = db.risk_snapshots.insert_one(snapshot)

    return {
        "tasks_checked": len(active_tasks),
        "risks_changed": risks_changed,
        "snapshot_id": str(result.inserted_id),
        "email_alerts": email_alerts,
    }


def _get_risk_reason(task: dict, risk_level: str) -> str:
    now = utc_now()

    if task.get("deadline"):
        deadline = task["deadline"]
        hours_remaining = (deadline - now).total_seconds() / 3600
        if hours_remaining <= 0:
            return f'"{task["title"]}" is overdue'
        if hours_remaining <= 24:
            return f'"{task["title"]}" is due in less than 24 hours'
        if hours_remaining <= 72:
            return f'"{task["title"]}" is due within 3 days'

    hours_inactive = (now - task["last_activity_at"]).total_seconds() / 3600
    days_inactive = int(hours_inactive / 24)
    if days_inactive >= 2:
        return f'"{task["title"]}" has been inactive for {days_inactive} days'

    return f'"{task["title"]}" risk level changed to {risk_level}'
