"""
WMS GetFeatureInfo client.

Port of wmsFeatureInfoClient.ts + featureInfoEndpoints.ts.
"""

from dataclasses import dataclass

from app.clients.http import fetch_text

DELTA = 0.001  # ~111m at equator


@dataclass(frozen=True)
class WmsEndpoint:
    name: str
    url: str
    layers: str
    version: str  # "1.1.0" or "1.3.0"
    info_format: str
    category: str  # "klima" | "risiko" | "generelt"
    result_key: str


FEATURE_INFO_ENDPOINTS: list[WmsEndpoint] = [
    # ---- Klima ----
    WmsEndpoint(
        name="Flomsone 50-årsflom",
        url="https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer",
        layers="Flomsone_50arsflom",
        version="1.3.0",
        info_format="application/geo+json",
        category="klima",
        result_key="flom50",
    ),
    WmsEndpoint(
        name="Flomsone 100-årsflom",
        url="https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer",
        layers="Flomsone_100arsflom",
        version="1.3.0",
        info_format="application/geo+json",
        category="klima",
        result_key="flom100",
    ),
    WmsEndpoint(
        name="Flomsone 200-årsflom",
        url="https://nve.geodataonline.no/arcgis/services/Flomsoner1/MapServer/WMSServer",
        layers="Flomsone_200arsflom",
        version="1.3.0",
        info_format="application/geo+json",
        category="klima",
        result_key="flom200",
    ),
    WmsEndpoint(
        name="Skredfaresone 100-års",
        url="https://nve.geodataonline.no/arcgis/services/Skredfaresoner1/MapServer/WMSServer",
        layers="Skredsoner_100",
        version="1.3.0",
        info_format="application/geo+json",
        category="klima",
        result_key="skred100",
    ),
    # ---- Risiko ----
    WmsEndpoint(
        name="Radon",
        url="https://geo.ngu.no/mapserver/RadonWMS2",
        layers="Radon_aktsomhet",
        version="1.1.0",
        info_format="application/vnd.ogc.gml",
        category="risiko",
        result_key="radon",
    ),
    WmsEndpoint(
        name="Kvikkleire",
        url="https://nve.geodataonline.no/arcgis/services/KvikkleireskredAktsomhet/MapServer/WMSServer",
        layers="KvikkleireskredAktsomhet",
        version="1.3.0",
        info_format="application/geo+json",
        category="risiko",
        result_key="kvikkleire",
    ),
    WmsEndpoint(
        name="Løsmasser",
        url="https://geo.ngu.no/mapserver/LosmasserWMS2",
        layers="Losmasse_flate",
        version="1.1.0",
        info_format="application/vnd.ogc.gml",
        category="risiko",
        result_key="losmasser",
    ),
    WmsEndpoint(
        name="Berggrunn",
        url="https://geo.ngu.no/mapserver/BerggrunnWMS3",
        layers="Berggrunn_nasjonal_hovedbergarter",
        version="1.1.0",
        info_format="application/vnd.ogc.gml",
        category="risiko",
        result_key="berggrunn",
    ),
    # ---- Risiko: Støysoner ----
    WmsEndpoint(
        name="Støysone jernbane",
        url="https://wms.geonorge.no/skwms1/wms.stoysonerjernbanenett",
        layers="stoy",
        version="1.3.0",
        info_format="application/vnd.ogc.gml",
        category="risiko",
        result_key="stoyJernbane",
    ),
    WmsEndpoint(
        name="Støysone skytebane/militær",
        url="https://wms.geonorge.no/skwms1/wms.stoyskytebane",
        layers="stoyskytebane",
        version="1.3.0",
        info_format="text/plain",
        category="risiko",
        result_key="stoyMilitar",
    ),
    # ---- Generelt ----
    WmsEndpoint(
        name="Matrikkelkart",
        url="https://wms.geonorge.no/skwms1/wms.matrikkelkart",
        layers="teiger",
        version="1.3.0",
        info_format="text/plain",
        category="generelt",
        result_key="matrikkel",
    ),
    WmsEndpoint(
        name="Kommuneplan arealformål",
        url="https://nap.ft.dibk.no/services/wms/kommuneplaner/",
        layers="arealformal_kp",
        version="1.3.0",
        info_format="text/plain",
        category="generelt",
        result_key="kommuneplan",
    ),
    WmsEndpoint(
        name="Kommunedelplan arealformål",
        url="https://nap.ft.dibk.no/services/wms/kommuneplaner/",
        layers="arealformal_kdp",
        version="1.3.0",
        info_format="text/plain",
        category="generelt",
        result_key="kommunedelplan",
    ),
]


def _compute_bbox(lat: float, lng: float, version: str) -> tuple[str, str]:
    """Return (bbox_string, crs_param_value) for a GetFeatureInfo request."""
    min_lng = lng - DELTA
    max_lng = lng + DELTA
    min_lat = lat - DELTA
    max_lat = lat + DELTA
    bbox = f"{min_lng},{min_lat},{max_lng},{max_lat}"
    crs = "CRS:84" if version == "1.3.0" else "EPSG:4326"
    return bbox, crs


async def get_feature_info(endpoint: WmsEndpoint, lat: float, lng: float) -> str | None:
    """
    Send a WMS GetFeatureInfo request and return the raw response text.
    Returns None on failure (logged internally by fetch_text).
    """
    width = height = 256
    bbox, crs = _compute_bbox(lat, lng, endpoint.version)
    crs_param = "CRS" if endpoint.version == "1.3.0" else "SRS"

    params: dict[str, str] = {
        "SERVICE": "WMS",
        "VERSION": endpoint.version,
        "REQUEST": "GetFeatureInfo",
        "LAYERS": endpoint.layers,
        "QUERY_LAYERS": endpoint.layers,
        crs_param: crs,
        "BBOX": bbox,
        "WIDTH": str(width),
        "HEIGHT": str(height),
        "INFO_FORMAT": endpoint.info_format,
        "FORMAT": "image/png",
    }

    if endpoint.version == "1.3.0":
        params["I"] = str(width // 2)
        params["J"] = str(height // 2)
    else:
        params["X"] = str(width // 2)
        params["Y"] = str(height // 2)

    return await fetch_text(endpoint.url, params)
