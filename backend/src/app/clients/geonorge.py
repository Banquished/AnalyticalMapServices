"""
Geonorge Adresser API client.

Base URL: https://ws.geonorge.no/adresser/v1
"""

from app.clients._utils import build_url
from app.clients.http import fetch_json_strict

_BASE_URL = "https://ws.geonorge.no/adresser/v1"


async def search_addresses(
    *,
    sok: str | None = None,
    fuzzy: bool | None = None,
    sokemodus: str | None = None,
    adressenavn: str | None = None,
    kommunenummer: str | None = None,
    kommunenavn: str | None = None,
    gardsnummer: int | None = None,
    bruksnummer: int | None = None,
    postnummer: str | None = None,
    poststed: str | None = None,
    utkoordsys: int | None = None,
    treff_per_side: int | None = None,
    side: int | None = None,
) -> dict:
    url, params = build_url(_BASE_URL,"/sok", {
        "sok": sok,
        "fuzzy": fuzzy,
        "sokemodus": sokemodus,
        "adressenavn": adressenavn,
        "kommunenummer": kommunenummer,
        "kommunenavn": kommunenavn,
        "gardsnummer": gardsnummer,
        "bruksnummer": bruksnummer,
        "postnummer": postnummer,
        "poststed": poststed,
        "utkoordsys": utkoordsys,
        "treffPerSide": treff_per_side,
        "side": side,
    })
    return await fetch_json_strict(url, params)


async def search_addresses_by_point(
    *,
    lat: float,
    lon: float,
    radius: float,
    koordsys: int | None = None,
    utkoordsys: int | None = None,
    treff_per_side: int | None = None,
    side: int | None = None,
) -> dict:
    url, params = build_url(_BASE_URL,"/punktsok", {
        "lat": lat,
        "lon": lon,
        "radius": radius,
        "koordsys": koordsys,
        "utkoordsys": utkoordsys,
        "treffPerSide": treff_per_side,
        "side": side,
    })
    return await fetch_json_strict(url, params)
