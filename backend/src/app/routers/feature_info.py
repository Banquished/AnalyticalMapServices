from typing import Annotated

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.clients.http import ApiError
from app.domain.types import FeatureInfoData
from app.services.feature_info import fetch_feature_info

router = APIRouter(tags=["feature-info"])


@router.get("/feature-info", response_model=FeatureInfoData)
async def get_feature_info(
    lat: Annotated[float, Query(ge=-90, le=90, description="Latitude (WGS84)")],
    lng: Annotated[float, Query(ge=-180, le=180, description="Longitude (WGS84)")],
) -> FeatureInfoData:
    """
    Fetch aggregated feature info for a coordinate.

    Queries 13 WMS endpoints + 4 ArcGIS REST endpoints in parallel,
    parses all responses, and returns a unified FeatureInfoData object.
    Results are cached by rounded coordinate (TTL 1 h).
    """
    try:
        return await fetch_feature_info(lat, lng)
    except (ApiError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
