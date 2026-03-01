"""
Kartverket Eiendom API client.

Base URL: https://api.kartverket.no/eiendom/v1
"""

from typing import Any

from app.clients.http import fetch_json_strict

_BASE_URL = "https://api.kartverket.no/eiendom/v1"


def _build_url(path: str, params: dict[str, Any]) -> tuple[str, dict[str, str]]:
    """Return (url, cleaned_params) with None values removed."""
    def _fmt(v: Any) -> str:
        if isinstance(v, bool):
            return str(v).lower()           # True → "true"
        if isinstance(v, float) and v.is_integer():
            return str(int(v))              # 200.0 → "200"
        return str(v)

    cleaned = {k: _fmt(v) for k, v in params.items() if v is not None and v != ""}
    return f"{_BASE_URL}{path}", cleaned


async def get_geokoding(
    *,
    matrikkelnummer: str | None = None,
    kommunenummer: str | None = None,
    gardsnummer: int | None = None,
    bruksnummer: int | None = None,
    festenummer: int | None = None,
    seksjonsnummer: int | None = None,
    omrade: bool | None = None,
    utkoordsys: int | None = None,
) -> dict:
    url, params = _build_url("/geokoding", {
        "matrikkelnummer": matrikkelnummer,
        "kommunenummer": kommunenummer,
        "gardsnummer": gardsnummer,
        "bruksnummer": bruksnummer,
        "festenummer": festenummer,
        "seksjonsnummer": seksjonsnummer,
        "omrade": omrade,
        "utkoordsys": utkoordsys,
    })
    return await fetch_json_strict(url, params)


async def get_properties_by_point(
    *,
    ost: float,
    nord: float,
    koordsys: int = 4258,
    radius: int | None = None,
    treff_per_side: int | None = None,
    side: int | None = None,
    utkoordsys: int | None = None,
) -> dict:
    url, params = _build_url("/punkt", {
        "ost": ost,
        "nord": nord,
        "koordsys": koordsys,
        "radius": radius,
        "treffPerSide": treff_per_side,
        "side": side,
        "utkoordsys": utkoordsys,
    })
    return await fetch_json_strict(url, params)


async def get_property_areas_by_point(
    *,
    ost: float,
    nord: float,
    koordsys: int = 4258,
    radius: int | None = None,
    maks_treff: int | None = None,
    utkoordsys: int | None = None,
) -> dict:
    url, params = _build_url("/punkt/omrader", {
        "ost": ost,
        "nord": nord,
        "koordsys": koordsys,
        "radius": radius,
        "maksTreff": maks_treff,
        "utkoordsys": utkoordsys,
    })
    return await fetch_json_strict(url, params)
