"""
Miljødirektoratet Grunnforurensning ArcGIS REST client.

API: https://kart.miljodirektoratet.no/arcgis/rest/services/grunnforurensning2/MapServer
Layer 1 = forurenset_omrade (contaminated area polygons)
"""

import logging

from app.clients.http import ApiError, fetch_json

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://kart.miljodirektoratet.no/arcgis/rest/services/grunnforurensning2/MapServer"
)
_LAYER_ID = 1
_OUT_FIELDS = ",".join([
    "Lokalitetnavn",
    "Lokalitettype",
    "Myndighet",
    "Prosesstatus",
    "Pavirkningsgrad",
    "HelsebasertTilstandsklasse",
    "Faktaark",
])


async def query_grunnforurensning(lat: float, lng: float) -> list[dict]:
    """
    Query contaminated ground sites that contain (lat, lng).
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
        err = data.get("error", {})
        raise ApiError(
            "arcgis_error",
            f"ArcGIS error from {_BASE_URL}: {err}",
            status=err.get("code") if isinstance(err, dict) else None,
        )
    features = data.get("features", [])
    if not isinstance(features, list):
        logger.warning("Unexpected ArcGIS response format")
        return []
    return [f["attributes"] for f in features if isinstance(f, dict) and "attributes" in f]
