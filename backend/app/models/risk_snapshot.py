from datetime import datetime

from sqlalchemy import DateTime, Index, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.utils.time_helpers import utc_now


class RiskSnapshot(Base):
    __tablename__ = "risk_snapshots"
    __table_args__ = (Index("idx_risk_snapshots_at", "snapshot_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    snapshot_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    red_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    yellow_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    green_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tasks: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
