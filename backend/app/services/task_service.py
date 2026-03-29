import json
import uuid

from pymongo.database import Database

from app.services.risk_engine import compute_risk
from app.utils.time_helpers import utc_now


def _update_risk(task: dict) -> str:
    return compute_risk(
        status=task["status"],
        priority=task["priority"],
        deadline=task.get("deadline"),
        last_activity_at=task["last_activity_at"],
    )


def _log_activity(
    db: Database, task_id: str, action: str, detail: dict | None = None
) -> None:
    db.activity_log.insert_one({
        "task_id": task_id,
        "action": action,
        "detail": json.dumps(detail) if detail else None,
        "created_at": utc_now(),
    })


def create_task(db: Database, user_id: str, data: dict) -> dict:
    now = utc_now()
    task = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": data["title"],
        "description": data.get("description"),
        "priority": data.get("priority", "medium"),
        "status": data.get("status", "todo"),
        "risk_level": "green",
        "tags": data.get("tags", []),
        "deadline": data.get("deadline"),
        "last_activity_at": now,
        "created_at": now,
        "updated_at": now,
        "completed_at": now if data.get("status") == "done" else None,
    }

    task["risk_level"] = compute_risk(
        status=task["status"],
        priority=task["priority"],
        deadline=task.get("deadline"),
        last_activity_at=task["last_activity_at"],
    )

    db.tasks.insert_one(task)
    _log_activity(db, task["_id"], "created")
    return task


def get_task(db: Database, task_id: str, user_id: str) -> dict | None:
    return db.tasks.find_one({"_id": task_id, "user_id": user_id})


def list_tasks(
    db: Database,
    user_id: str,
    status: str | None = None,
    risk: str | None = None,
    priority: str | None = None,
    tag: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = 1,
    size: int = 20,
) -> tuple[list[dict], int]:
    query: dict = {"user_id": user_id}
    if status:
        query["status"] = status
    if risk:
        query["risk_level"] = risk
    if priority:
        query["priority"] = priority
    if tag:
        query["tags"] = tag

    total = db.tasks.count_documents(query)

    sort_dir = -1 if order == "desc" else 1
    sort_field = sort if sort in ("created_at", "deadline", "updated_at", "priority") else "created_at"

    tasks = list(
        db.tasks.find(query)
        .sort(sort_field, sort_dir)
        .skip((page - 1) * size)
        .limit(size)
    )
    return tasks, total


def update_task(db: Database, task: dict, data: dict) -> dict:
    changes = {}
    for field, value in data.items():
        if value is not None:
            old_value = task.get(field)
            if old_value != value:
                changes[field] = {"old": str(old_value), "new": str(value)}

    updates: dict = {}
    for field, value in data.items():
        if value is not None:
            updates[field] = value

    now = utc_now()
    updates["last_activity_at"] = now
    updates["updated_at"] = now

    if "status" in data:
        if data["status"] == "done":
            updates["completed_at"] = now
        elif task.get("status") == "done":
            updates["completed_at"] = None

    # Recalculate risk
    merged = {**task, **updates}
    updates["risk_level"] = compute_risk(
        status=merged["status"],
        priority=merged["priority"],
        deadline=merged.get("deadline"),
        last_activity_at=merged["last_activity_at"],
    )

    old_risk = task.get("risk_level")

    db.tasks.update_one({"_id": task["_id"]}, {"$set": updates})

    if changes:
        _log_activity(db, task["_id"], "updated", changes)
    if old_risk != updates["risk_level"]:
        _log_activity(db, task["_id"], "risk_changed", {"old": old_risk, "new": updates["risk_level"]})

    return db.tasks.find_one({"_id": task["_id"]})


def update_status(db: Database, task: dict, new_status: str) -> dict:
    old_status = task["status"]
    now = utc_now()

    updates: dict = {
        "status": new_status,
        "last_activity_at": now,
        "updated_at": now,
    }

    if new_status == "done":
        updates["completed_at"] = now
    elif old_status == "done":
        updates["completed_at"] = None

    merged = {**task, **updates}
    new_risk = compute_risk(
        status=merged["status"],
        priority=merged["priority"],
        deadline=merged.get("deadline"),
        last_activity_at=merged["last_activity_at"],
    )
    updates["risk_level"] = new_risk

    db.tasks.update_one({"_id": task["_id"]}, {"$set": updates})

    _log_activity(db, task["_id"], "status_changed", {"old": old_status, "new": new_status})
    if task.get("risk_level") != new_risk:
        _log_activity(db, task["_id"], "risk_changed", {"old": task.get("risk_level"), "new": new_risk})

    return db.tasks.find_one({"_id": task["_id"]})


def delete_task(db: Database, task_id: str) -> None:
    db.tasks.delete_one({"_id": task_id})
    db.activity_log.delete_many({"task_id": task_id})
    db.notifications.delete_many({"task_id": task_id})


def get_task_activity(
    db: Database, task_id: str, page: int = 1, size: int = 50
) -> tuple[list[dict], int]:
    query = {"task_id": task_id}
    total = db.activity_log.count_documents(query)
    logs = list(
        db.activity_log.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * size)
        .limit(size)
    )
    return logs, total
