from fastapi import APIRouter, Query

from app.domain.types import FeatureInfoData
from app.services.feature_info import fetch_feature_info

router = APIRouter(tags=["feature-info"])


@router.get("/feature-info", response_model=FeatureInfoData)
async def get_feature_info(
    lat: float = Query(..., description="Latitude (WGS84)"),
    lng: float = Query(..., description="Longitude (WGS84)"),
) -> FeatureInfoData:
    """
    Fetch aggregated feature info for a coordinate.

    Queries 13 WMS endpoints + 4 ArcGIS REST endpoints in parallel,
    parses all responses, and returns a unified FeatureInfoData object.
    Results are cached by rounded coordinate (TTL 1 h).
    """
    return await fetch_feature_info(lat, lng)
