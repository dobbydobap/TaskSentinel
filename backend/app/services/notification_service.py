from sqlalchemy.orm import Session

from app.models.notification import Notification


def get_notifications(
    db: Session,
    user_id: str,
    unread_only: bool = False,
    page: int = 1,
    size: int = 20,
) -> tuple[list[Notification], int]:
    query = (
        db.query(Notification)
        .join(Notification.task)
        .filter(Notification.task.has(user_id=user_id))
    )
    if unread_only:
        query = query.filter(Notification.is_read == False)

    total = query.count()
    notifications = (
        query.order_by(Notification.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )
    return notifications, total


def get_unread_count(db: Session, user_id: str) -> int:
    return (
        db.query(Notification)
        .join(Notification.task)
        .filter(
            Notification.task.has(user_id=user_id),
            Notification.is_read == False,
        )
        .count()
    )


def mark_read(db: Session, notification_id: int, user_id: str) -> Notification | None:
    notification = (
        db.query(Notification)
        .join(Notification.task)
        .filter(
            Notification.id == notification_id,
            Notification.task.has(user_id=user_id),
        )
        .first()
    )
    if notification:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_read(db: Session, user_id: str) -> int:
    notifications = (
        db.query(Notification)
        .join(Notification.task)
        .filter(
            Notification.task.has(user_id=user_id),
            Notification.is_read == False,
        )
        .all()
    )
    count = len(notifications)
    for n in notifications:
        n.is_read = True
    db.commit()
    return count
