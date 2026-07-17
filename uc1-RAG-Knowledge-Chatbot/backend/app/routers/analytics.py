from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.dependencies import require_api_key
from app.repositories import analytics_repo
from app.schemas.analytics import AnalyticsOut

router = APIRouter(prefix="/analytics", tags=["analytics"], dependencies=[Depends(require_api_key)])


@router.get("", response_model=AnalyticsOut)
async def get_analytics(db: AsyncSession = Depends(get_db)) -> AnalyticsOut:
    totals = await analytics_repo.get_totals(db)
    usage_by_model = await analytics_repo.get_usage_by_model(db)
    return AnalyticsOut(totals=totals, usage_by_model=usage_by_model)
