import certifi
from pymongo import MongoClient
from pymongo.database import Database

from app.config import settings

_client: MongoClient | None = None
_db: Database | None = None


def _get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(
            settings.MONGODB_URL,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
        )
    return _client


def get_db() -> Database:
    global _db
    if _db is None:
        _db = _get_client()[settings.MONGODB_DB_NAME]
    return _db


def init_indexes() -> None:
    """Create indexes for performance."""
    try:
        db = get_db()
        db.users.create_index("email", unique=True)
        db.tasks.create_index("user_id")
        db.tasks.create_index("risk_level")
        db.tasks.create_index("status")
        db.tasks.create_index("deadline")
        db.activity_log.create_index("task_id")
        db.notifications.create_index([("task_id", 1), ("is_read", 1)])
        db.risk_snapshots.create_index("snapshot_at")
        print("MongoDB indexes created successfully")
    except Exception as e:
        print(f"Warning: MongoDB index creation failed: {e}")
