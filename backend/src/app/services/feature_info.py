"""
Feature info service — orchestrates all upstream calls and assembles FeatureInfoData.

Port of fetchAllFeatureInfo() in useFeatureInfo.ts.
"""

import asyncio
import logging
import time

from app.cache import coord_cache_key, get_cache
from app.clients import (
    grunnforurensning as grunnforurensning_client,
)
from app.clients import (
    kulturminner as kulturminner_client,
)
from app.clients import (
    naturvern as naturvern_client,
)
from app.clients import (
    stoy as stoy_client,
)
from app.clients.wms import FEATURE_INFO_ENDPOINTS, get_feature_info
from app.domain.parsers.generelt import (
    parse_kommunedelplan,
    parse_kommuneplan,
    parse_matrikkel_info,
)
from app.domain.parsers.klima import parse_flood_zone, parse_kvikkleire, parse_landslide_zone
from app.domain.parsers.risiko import (
    parse_berggrunn,
    parse_grunnforurensning,
    parse_kulturminner,
    parse_losmasse,
    parse_naturvern,
    parse_radon,
    parse_stoy_data,
)
from app.domain.types import (
    FeatureInfoData,
    GenereltData,
    KlimaData,
    RisikoData,
)

logger = logging.getLogger(__name__)


def _safe[T](fn) -> T | None:
    try:
        return fn()
    except Exception as exc:
        logger.warning("Parser error: %s", exc)
        return None


async def fetch_feature_info(lat: float, lng: float) -> FeatureInfoData:
    """
    Fetch and parse all feature info for (lat, lng).
    Results are cached by rounded coordinate key.
    """
    cache = get_cache()
    cache_key = coord_cache_key(lat, lng)
    if cache_key in cache:
        logger.debug("Cache hit for %s", cache_key)
        return cache[cache_key]

    # -----------------------------------------------------------------------
    # Fire all upstream calls in parallel
    # -----------------------------------------------------------------------
    wms_tasks = [get_feature_info(ep, lat, lng) for ep in FEATURE_INFO_ENDPOINTS]
    rest_tasks = [
        kulturminner_client.query_kulturminner(lat, lng),
        stoy_client.query_stoy_veg(lat, lng),
        naturvern_client.query_naturvern(lat, lng),
        grunnforurensning_client.query_grunnforurensning(lat, lng),
    ]

    all_results = await asyncio.gather(*wms_tasks, *rest_tasks, return_exceptions=True)

    # WMS results (indices 0..len(FEATURE_INFO_ENDPOINTS)-1)
    n_wms = len(FEATURE_INFO_ENDPOINTS)
    raw_results: dict[str, str | None] = {}
    for i, ep in enumerate(FEATURE_INFO_ENDPOINTS):
        result = all_results[i]
        if isinstance(result, BaseException):
            logger.warning("WMS %s failed: %s", ep.name, result)
            raw_results[ep.result_key] = None
        else:
            raw_results[ep.result_key] = result

    # REST results (indices n_wms..n_wms+3)
    def _rest(idx: int) -> list[dict]:
        result = all_results[n_wms + idx]
        if isinstance(result, BaseException):
            logger.warning("REST query %d failed: %s", idx, result)
            return []
        return result  # type: ignore[return-value]

    kulturminner_attrs = _rest(0)
    stoy_veg_attrs = _rest(1)
    naturvern_attrs = _rest(2)
    grunnforurensning_attrs = _rest(3)

    # -----------------------------------------------------------------------
    # Parse klima
    # -----------------------------------------------------------------------
    klima = KlimaData(
        flom50=_safe(lambda: parse_flood_zone(raw_results.get("flom50"))),
        flom100=_safe(lambda: parse_flood_zone(raw_results.get("flom100"))),
        flom200=_safe(lambda: parse_flood_zone(raw_results.get("flom200"))),
        skred100=_safe(lambda: parse_landslide_zone(raw_results.get("skred100"))),
    )

    # -----------------------------------------------------------------------
    # Parse risiko
    # -----------------------------------------------------------------------
    risiko = RisikoData(
        radon=_safe(lambda: parse_radon(raw_results.get("radon"))),
        kvikkleire=_safe(lambda: parse_kvikkleire(raw_results.get("kvikkleire"))),
        losmasser=_safe(lambda: parse_losmasse(raw_results.get("losmasser"))),
        berggrunn=_safe(lambda: parse_berggrunn(raw_results.get("berggrunn"))),
        kulturminner=_safe(lambda: parse_kulturminner(kulturminner_attrs)),
        stoy=_safe(
            lambda: parse_stoy_data(
                veg_attrs=stoy_veg_attrs or None,
                jernbane_raw=raw_results.get("stoyJernbane"),
                militar_raw=raw_results.get("stoyMilitar"),
            )
        ),
        naturvern=_safe(lambda: parse_naturvern(naturvern_attrs)),
        grunnforurensning=_safe(lambda: parse_grunnforurensning(grunnforurensning_attrs)),
    )

    # -----------------------------------------------------------------------
    # Parse generelt
    # -----------------------------------------------------------------------
    matrikkel_raw = raw_results.get("matrikkel")
    kommuneplan_raw = raw_results.get("kommuneplan")
    kommunedelplan_raw = raw_results.get("kommunedelplan")

    kommuneplan = _safe(lambda: parse_kommuneplan(kommuneplan_raw))
    kommunedelplan = _safe(lambda: parse_kommunedelplan(kommunedelplan_raw))
    base = _safe(lambda: parse_matrikkel_info(matrikkel_raw))

    if base is None and kommuneplan is None and kommunedelplan is None:
        generelt = None
    else:
        generelt = GenereltData(
            matrikkelInfo=base.matrikkelInfo if base else "",
            details=base.details if base else {},
            serviceError=base.serviceError if base else None,
            kommuneplan=kommuneplan,
            kommunedelplan=kommunedelplan,
        )

    data = FeatureInfoData(
        klima=klima,
        risiko=risiko,
        generelt=generelt,
        fetchedAt=int(time.time() * 1000),
    )

    cache[cache_key] = data
    return data
