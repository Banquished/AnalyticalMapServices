"""
Miljødirektoratet Naturvernområder ArcGIS REST client.

API: https://kart.miljodirektoratet.no/arcgis/rest/services/vern/MapServer
Layer 0 = naturvern_omrade (protected area polygons)
"""

import logging

from app.clients.http import ApiError, fetch_json

logger = logging.getLogger(__name__)

_BASE_URL = "https://kart.miljodirektoratet.no/arcgis/rest/services/vern/MapServer"
_LAYER_ID = 0
_OUT_FIELDS = ",".join([
    "navn",
    "offisieltNavn",
    "verneform",
    "verneplan",
    "vernedato",
    "majorEcosystemType",
    "iucn",
    "faktaark",
])


async def query_naturvern(lat: float, lng: float) -> list[dict]:
    """
    Query protected nature areas that contain (lat, lng).
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
        err = data["error"]
        raise ApiError(
            "arcgis",
            str(err.get("message", "unknown")) if isinstance(err, dict) else str(err),
            _BASE_URL,
        )
    features = data.get("features", [])
    if not isinstance(features, list):
        logger.warning("Unexpected ArcGIS response format")
        return []
    return [f["attributes"] for f in features if isinstance(f, dict) and "attributes" in f]
