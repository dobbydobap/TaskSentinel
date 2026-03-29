from fastapi import APIRouter, Depends, Header, HTTPException

from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.dashboard import SweepResponse
from app.services.monitor_service import run_sweep
from app.utils.time_helpers import utc_now

router = APIRouter()


def verify_monitor_key(x_monitor_key: str = Header(...)) -> str:
    if x_monitor_key != settings.MONITOR_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid monitor key")
    return x_monitor_key


@router.post("/sweep", response_model=SweepResponse)
def trigger_sweep(
    db: Session = Depends(get_db),
    _key: str = Depends(verify_monitor_key),
):
    result = run_sweep(db)
    return SweepResponse(**result)


@router.get("/health")
def health():
    return {"status": "ok", "timestamp": utc_now().isoformat()}
