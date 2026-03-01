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
        pass
    return []


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
        parts.append(status)
    detail = (
        f"Eiendommen ligger i flomsone ({', '.join(parts)})"
        if parts
        else "Eiendommen ligger i flomsone"
    )
    return FloodZoneResult(inZone=True, detail=detail)


def parse_landslide_zone(raw: str | None) -> FloodZoneResult | None:
    if not raw or not raw.strip():
        return None
    features = _parse_nve_geojson(raw)
    if not features:
        return None
    first = features[0]
    parts: list[str] = []
    if skredtype := first.get("skredtype"):
        parts.append(skredtype)
    if faresone := first.get("faresone"):
        parts.append(faresone)
    detail = (
        f"Eiendommen ligger i skredfaresone ({', '.join(parts)})"
        if parts
        else "Eiendommen ligger i skredfaresone"
    )
    return FloodZoneResult(inZone=True, detail=detail)


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
