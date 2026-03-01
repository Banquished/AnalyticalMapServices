"""
Parsers for NVE GeoJSON WMS responses (Flood zones, Landslide zones, Kvikkleire).

Port of featureInfoParser.ts — parseFloodZone, parseLandslideZone, parseKvikkleire.
"""

import json
import logging

from app.domain.types import FloodZoneResult, KvikkleireResult

logger = logging.getLogger(__name__)


def _parse_nve_geojson(raw: str) -> list[dict]:
    """Parse a NVE GeoJSON FeatureCollection; return list of property dicts."""
    try:
        parsed = json.loads(raw)
        if parsed.get("type") == "FeatureCollection" and isinstance(
            parsed.get("features"), list
        ):
            return [f.get("properties") or {} for f in parsed["features"]]
    except (json.JSONDecodeError, AttributeError):
        logger.warning("Failed to parse NVE GeoJSON")
    return []


def _parse_nve_zone(
    raw: str | None,
    zone_label: str,
    detail_fields: list[str],
) -> FloodZoneResult | None:
    """Shared helper for flood and landslide zone parsing.

    Args:
        raw: WMS response text.
        zone_label: Norwegian label for the zone type (e.g. "flomsone").
        detail_fields: Feature property keys to include in the detail string.
    """
    if not raw or not raw.strip():
        return None
    features = _parse_nve_geojson(raw)
    if not features:
        return None
    first = features[0]
    parts = [v for key in detail_fields if (v := first.get(key))]
    detail = (
        f"Eiendommen ligger i {zone_label} ({', '.join(str(p) for p in parts)})"
        if parts
        else f"Eiendommen ligger i {zone_label}"
    )
    return FloodZoneResult(inZone=True, detail=detail)


def parse_flood_zone(raw: str | None) -> FloodZoneResult | None:
    if not raw or not raw.strip():
        return None
    features = _parse_nve_geojson(raw)
    if not features:
        return None
    first = features[0]
    parts: list[str] = []
    if interval := first.get("gjentaksinterval"):
        parts.append(f"{interval}-års gjentaksintervall")
    if status := first.get("statusKartlegging"):
        parts.append(str(status))
    detail = (
        f"Eiendommen ligger i flomsone ({', '.join(parts)})"
        if parts
        else "Eiendommen ligger i flomsone"
    )
    return FloodZoneResult(inZone=True, detail=detail)


def parse_landslide_zone(raw: str | None) -> FloodZoneResult | None:
    return _parse_nve_zone(raw, "skredfaresone", ["skredtype", "faresone"])


def parse_kvikkleire(raw: str | None) -> KvikkleireResult | None:
    if not raw or not raw.strip():
        return None
    features = _parse_nve_geojson(raw)
    if not features:
        return None
    first = features[0]
    skred_type = first.get("skredType")
    detail = (
        f"Eiendommen ligger i aktsomhetsområde for {skred_type.lower()}"
        if skred_type
        else "Eiendommen ligger i kvikkleireskred-aktsomhetsområde"
    )
    return KvikkleireResult(inZone=True, detail=detail)
