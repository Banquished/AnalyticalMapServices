"""
Riksantikvaren Kulturminner ArcGIS REST client.

NOTE: Riksantikvaren has announced changes to this API from 15.04.2026.
The MapServer URL or layer IDs may change — keep this file isolated for easy update.
"""

import logging

from app.clients.http import fetch_json

logger = logging.getLogger(__name__)

_BASE_URL = (
    "https://kart.ra.no/arcgis/rest/services/Distribusjon/Kulturminner20180301/MapServer"
)
_LAYER_ID = 5  # Lokalitetsikoner — broadest coverage
_SEARCH_RADIUS_M = 200
_OUT_FIELDS = ",".join([
    "navn",
    "vernetype",
    "vernedato",
    "vernelov",
    "verneparagraf",
    "kulturminneKategori",
    "kulturminneLokalitetArt",
    "kulturminneOpprinngeligFunksjon",
    "kommune",
    "linkKulturminnesok",
    "informasjon",
])


async def query_kulturminner(lat: float, lng: float) -> list[dict]:
    """
    Query cultural heritage sites within _SEARCH_RADIUS_M metres of (lat, lng).
    Returns list of ArcGIS feature attribute dicts (may be empty).
    """
    url = f"{_BASE_URL}/{_LAYER_ID}/query"
    params = {
        "geometry": f"{lng},{lat}",
        "geometryType": "esriGeometryPoint",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "distance": str(_SEARCH_RADIUS_M),
        "units": "esriSRUnit_Meter",
        "outFields": _OUT_FIELDS,
        "returnGeometry": "false",
        "f": "json",
    }
    data = await fetch_json(url, params)
    if data is None:
        return []
    if "error" in data:
        logger.warning("Kulturminner API error: %s", data["error"])
        return []
    return [f["attributes"] for f in data.get("features", [])]
