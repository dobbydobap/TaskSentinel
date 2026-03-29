from pymongo import MongoClient
from pymongo.database import Database

from app.config import settings

client: MongoClient = MongoClient(settings.MONGODB_URL)
db: Database = client[settings.MONGODB_DB_NAME]


def get_db() -> Database:
    return db


def init_indexes() -> None:
    """Create indexes for performance."""
    db.users.create_index("email", unique=True)
    db.tasks.create_index("user_id")
    db.tasks.create_index("risk_level")
    db.tasks.create_index("status")
    db.tasks.create_index("deadline")
    db.activity_log.create_index("task_id")
    db.notifications.create_index([("task_id", 1), ("is_read", 1)])
    db.risk_snapshots.create_index("snapshot_at")
