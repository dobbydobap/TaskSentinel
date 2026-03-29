import json

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.activity import ActivityLog
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.risk_engine import compute_risk
from app.utils.time_helpers import utc_now


def _update_risk(task: Task) -> str:
    """Recalculate and set risk_level on a task. Returns the new level."""
    new_risk = compute_risk(
        status=task.status,
        priority=task.priority,
        deadline=task.deadline,
        last_activity_at=task.last_activity_at,
    )
    task.risk_level = new_risk
    return new_risk


def _log_activity(
    db: Session, task_id: str, action: str, detail: dict | None = None
) -> None:
    log = ActivityLog(
        task_id=task_id,
        action=action,
        detail=json.dumps(detail) if detail else None,
    )
    db.add(log)


def create_task(db: Session, user_id: str, data: TaskCreate) -> Task:
    now = utc_now()
    task = Task(
        user_id=user_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        status=data.status,
        tags=json.dumps(data.tags),
        deadline=data.deadline,
        last_activity_at=now,
        created_at=now,
        updated_at=now,
    )
    if data.status == "done":
        task.completed_at = now

    _update_risk(task)
    db.add(task)
    db.flush()
    _log_activity(db, task.id, "created")
    db.commit()
    db.refresh(task)
    return task


def get_task(db: Session, task_id: str, user_id: str) -> Task | None:
    return (
        db.query(Task)
        .filter(Task.id == task_id, Task.user_id == user_id)
        .first()
    )


def list_tasks(
    db: Session,
    user_id: str,
    status: str | None = None,
    risk: str | None = None,
    priority: str | None = None,
    tag: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = 1,
    size: int = 20,
) -> tuple[list[Task], int]:
    query = db.query(Task).filter(Task.user_id == user_id)

    if status:
        query = query.filter(Task.status == status)
    if risk:
        query = query.filter(Task.risk_level == risk)
    if priority:
        query = query.filter(Task.priority == priority)
    if tag:
        query = query.filter(Task.tags.contains(f'"{tag}"'))

    total = query.count()

    sort_col = getattr(Task, sort, Task.created_at)
    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    tasks = query.offset((page - 1) * size).limit(size).all()
    return tasks, total


def update_task(db: Session, task: Task, data: TaskUpdate) -> Task:
    changes = {}
    for field, value in data.model_dump(exclude_unset=True).items():
        old_value = getattr(task, field)
        if field == "tags":
            value = json.dumps(value)
            old_value = task.tags
        if old_value != value:
            changes[field] = {"old": str(old_value), "new": str(value)}
            setattr(task, field, value)

    if "status" in changes and data.status == "done":
        task.completed_at = utc_now()
    elif "status" in changes and data.status != "done":
        task.completed_at = None

    now = utc_now()
    task.last_activity_at = now
    task.updated_at = now

    old_risk = task.risk_level
    new_risk = _update_risk(task)

    if changes:
        _log_activity(db, task.id, "updated", changes)
    if old_risk != new_risk:
        _log_activity(
            db, task.id, "risk_changed", {"old": old_risk, "new": new_risk}
        )

    db.commit()
    db.refresh(task)
    return task


def update_status(db: Session, task: Task, new_status: str) -> Task:
    old_status = task.status
    task.status = new_status
    now = utc_now()
    task.last_activity_at = now
    task.updated_at = now

    if new_status == "done":
        task.completed_at = now
    elif old_status == "done":
        task.completed_at = None

    old_risk = task.risk_level
    new_risk = _update_risk(task)

    _log_activity(
        db, task.id, "status_changed", {"old": old_status, "new": new_status}
    )
    if old_risk != new_risk:
        _log_activity(
            db, task.id, "risk_changed", {"old": old_risk, "new": new_risk}
        )

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()


def get_task_activity(
    db: Session, task_id: str, page: int = 1, size: int = 50
) -> tuple[list[ActivityLog], int]:
    query = (
        db.query(ActivityLog)
        .filter(ActivityLog.task_id == task_id)
        .order_by(ActivityLog.created_at.desc())
    )
    total = query.count()
    logs = query.offset((page - 1) * size).limit(size).all()
    return logs, total
