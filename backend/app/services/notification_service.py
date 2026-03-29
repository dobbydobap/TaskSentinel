from bson import ObjectId
from pymongo.database import Database


def get_notifications(
    db: Database,
    user_id: str,
    unread_only: bool = False,
    page: int = 1,
    size: int = 20,
) -> tuple[list[dict], int]:
    # Get task IDs belonging to user
    task_ids = [t["_id"] for t in db.tasks.find({"user_id": user_id}, {"_id": 1})]

    query: dict = {"task_id": {"$in": task_ids}}
    if unread_only:
        query["is_read"] = False

    total = db.notifications.count_documents(query)
    notifications = list(
        db.notifications.find(query)
        .sort("created_at", -1)
        .skip((page - 1) * size)
        .limit(size)
    )
    return notifications, total


def get_unread_count(db: Database, user_id: str) -> int:
    task_ids = [t["_id"] for t in db.tasks.find({"user_id": user_id}, {"_id": 1})]
    return db.notifications.count_documents({
        "task_id": {"$in": task_ids},
        "is_read": False,
    })


def mark_read(db: Database, notification_id: str, user_id: str) -> dict | None:
    task_ids = [t["_id"] for t in db.tasks.find({"user_id": user_id}, {"_id": 1})]

    # Try both ObjectId and string for notification_id
    try:
        oid = ObjectId(notification_id)
    except Exception:
        oid = None

    query = {"task_id": {"$in": task_ids}}
    if oid:
        query["_id"] = oid
    else:
        query["_id"] = notification_id

    notification = db.notifications.find_one(query)
    if notification:
        db.notifications.update_one(
            {"_id": notification["_id"]},
            {"$set": {"is_read": True}},
        )
        notification["is_read"] = True
    return notification


def mark_all_read(db: Database, user_id: str) -> int:
    task_ids = [t["_id"] for t in db.tasks.find({"user_id": user_id}, {"_id": 1})]
    result = db.notifications.update_many(
        {"task_id": {"$in": task_ids}, "is_read": False},
        {"$set": {"is_read": True}},
    )
    return result.modified_count
