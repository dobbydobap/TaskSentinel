from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.database import Database

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.activity import ActivityListResponse, ActivityResponse
from app.schemas.task import (
    StatusUpdate,
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskUpdate,
)
from app.services.task_service import (
    create_task,
    delete_task,
    get_task,
    get_task_activity,
    list_tasks,
    update_status,
    update_task,
)

router = APIRouter()


def _task_to_response(task: dict) -> TaskResponse:
    return TaskResponse(
        id=task["_id"],
        user_id=task["user_id"],
        title=task["title"],
        description=task.get("description"),
        priority=task["priority"],
        status=task["status"],
        risk_level=task.get("risk_level", "green"),
        tags=task.get("tags", []),
        deadline=task.get("deadline"),
        last_activity_at=task["last_activity_at"],
        created_at=task["created_at"],
        updated_at=task["updated_at"],
        completed_at=task.get("completed_at"),
    )


def _activity_to_response(log: dict) -> ActivityResponse:
    return ActivityResponse(
        id=str(log["_id"]),
        task_id=log["task_id"],
        action=log["action"],
        detail=log.get("detail"),
        created_at=log["created_at"],
    )


@router.get("", response_model=TaskListResponse)
def get_tasks(
    status_filter: str | None = Query(None, alias="status"),
    risk: str | None = None,
    priority: str | None = None,
    tag: str | None = None,
    sort: str = "created_at",
    order: str = "desc",
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    tasks, total = list_tasks(
        db, current_user["_id"], status_filter, risk, priority, tag, sort, order, page, size
    )
    return TaskListResponse(
        tasks=[_task_to_response(t) for t in tasks],
        total=total,
        page=page,
        size=size,
    )


@router.post("", response_model=TaskResponse, status_code=201)
def create(
    data: TaskCreate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task_data = data.model_dump(exclude_unset=True)
    task = create_task(db, current_user["_id"], task_data)
    return _task_to_response(task)


@router.get("/{task_id}", response_model=TaskResponse)
def get_one(
    task_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user["_id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update(
    task_id: str,
    data: TaskUpdate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user["_id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task = update_task(db, task, data.model_dump(exclude_unset=True))
    return _task_to_response(task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def change_status(
    task_id: str,
    data: StatusUpdate,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user["_id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task = update_status(db, task, data.status)
    return _task_to_response(task)


@router.delete("/{task_id}", status_code=204)
def remove(
    task_id: str,
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user["_id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    delete_task(db, task_id)


@router.get("/{task_id}/activity", response_model=ActivityListResponse)
def get_activity(
    task_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: Database = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user["_id"])
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    logs, total = get_task_activity(db, task_id, page, size)
    return ActivityListResponse(
        activities=[_activity_to_response(l) for l in logs],
        total=total,
    )
