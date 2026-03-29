from datetime import datetime

from app.utils.time_helpers import utc_now


def _naive(dt: datetime) -> datetime:
    """Strip timezone info for safe comparison."""
    return dt.replace(tzinfo=None) if dt.tzinfo else dt


def compute_risk(
    status: str,
    priority: str,
    deadline: datetime | None,
    last_activity_at: datetime,
) -> str:
    """Pure function: given task attributes, returns risk level."""
    if status in ("done", "cancelled"):
        return "green"

    now = utc_now()

    # Deadline-based rules
    if deadline is not None:
        hours_remaining = (_naive(deadline) - now).total_seconds() / 3600

        if hours_remaining <= 0:
            return "red"  # Overdue

        if hours_remaining <= 24:
            return "red"  # Due within 24h

        if hours_remaining <= 72:
            if priority in ("critical", "high"):
                return "red"
            return "yellow"

    # Inactivity-based rules
    hours_since_activity = (now - _naive(last_activity_at)).total_seconds() / 3600

    if hours_since_activity >= 120:  # 5+ days
        return "red"

    if hours_since_activity >= 48:  # 2+ days
        return "yellow"

    # Priority boost — critical tasks with deadline within 7 days
    if deadline is not None and priority == "critical":
        days_remaining = (_naive(deadline) - now).days
        if days_remaining <= 7:
            return "yellow"

    return "green"
