"""
Miljødirektoratet Støysoner ArcGIS REST client.

API: https://kart3.miljodirektoratet.no/arcgis/rest/services/stoy/stoykart_strategisk_veg/MapServer
Layer 5 = stoy_veg_storby_dogn (daytime road noise in urban areas)

⚠ Strategic road noise data is from 2011 — most recent nationwide dataset.
"""

import logging

from app.clients.http import fetch_json

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://kart3.miljodirektoratet.no/arcgis/rest/services/stoy/stoykart_strategisk_veg/MapServer"
)
_LAYER_ID = 5
_OUT_FIELDS = ",".join([
    "category",
    "source",
    "measuretime_beginposition",
    "measuretime_endposition",
])


async def query_stoy_veg(lat: float, lng: float) -> list[dict]:
    """
    Query road traffic noise zones that contain (lat, lng).
    Returns list of ArcGIS feature attribute dicts (may be empty).
    """
    url = f"{_BASE_URL}/{_LAYER_ID}/query"
    params = {
        "geometry": f"{lng},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": _OUT_FIELDS,
        "returnGeometry": "false",
        "f": "json",
    }
    data = await fetch_json(url, params)
    if data is None:
        return []
    if "error" in data:
        logger.warning("Støy veg API error: %s", data["error"])
        return []
    return [f["attributes"] for f in data.get("features", [])]
