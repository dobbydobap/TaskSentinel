import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.time_helpers import utc_now


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (
        Index("idx_tasks_risk_level", "risk_level"),
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_deadline", "deadline"),
        Index("idx_tasks_user_id", "user_id"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium"
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="todo")
    risk_level: Mapped[str] = mapped_column(
        String(10), nullable=False, default="green"
    )
    tags: Mapped[str | None] = mapped_column(Text, nullable=True, default="[]")
    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user = relationship("User", back_populates="tasks")
    activity_logs = relationship(
        "ActivityLog", back_populates="task", cascade="all, delete-orphan"
    )
    notifications = relationship(
        "Notification", back_populates="task", cascade="all, delete-orphan"
    )
