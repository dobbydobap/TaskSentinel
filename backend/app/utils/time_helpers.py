from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return current UTC time as a naive datetime (compatible with SQLite)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
