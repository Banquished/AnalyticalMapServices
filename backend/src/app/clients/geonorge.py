"""
Geonorge Adresser API client.

Base URL: https://ws.geonorge.no/adresser/v1
"""

from typing import Any

from app.clients.http import fetch_json_strict

_BASE_URL = "https://ws.geonorge.no/adresser/v1"


def _build_url(path: str, params: dict[str, Any]) -> tuple[str, dict[str, str]]:
    def _fmt(v: Any) -> str:
        if isinstance(v, bool):
            return str(v).lower()           # True → "true"
        if isinstance(v, float) and v.is_integer():
            return str(int(v))              # 200.0 → "200"
        return str(v)

    cleaned = {k: _fmt(v) for k, v in params.items() if v is not None and v != ""}
    return f"{_BASE_URL}{path}", cleaned


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
    url, params = _build_url("/sok", {
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
    url, params = _build_url("/punktsok", {
        "lat": lat,
        "lon": lon,
        "radius": radius,
        "koordsys": koordsys,
        "utkoordsys": utkoordsys,
        "treffPerSide": treff_per_side,
        "side": side,
    })
    return await fetch_json_strict(url, params)
