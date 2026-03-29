import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
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


def _task_to_response(task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        risk_level=task.risk_level,
        tags=json.loads(task.tags) if task.tags else [],
        deadline=task.deadline,
        last_activity_at=task.last_activity_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks, total = list_tasks(
        db, current_user.id, status_filter, risk, priority, tag, sort, order, page, size
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = create_task(db, current_user.id, data)
    return _task_to_response(task)


@router.get("/{task_id}", response_model=TaskResponse)
def get_one(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update(
    task_id: str,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task = update_task(db, task, data)
    return _task_to_response(task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def change_status(
    task_id: str,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task = update_status(db, task, data.status)
    return _task_to_response(task)


@router.delete("/{task_id}", status_code=204)
def remove(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    delete_task(db, task)


@router.get("/{task_id}/activity", response_model=ActivityListResponse)
def get_activity(
    task_id: str,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    logs, total = get_task_activity(db, task_id, page, size)
    return ActivityListResponse(
        activities=[ActivityResponse.model_validate(l) for l in logs],
        total=total,
    )
