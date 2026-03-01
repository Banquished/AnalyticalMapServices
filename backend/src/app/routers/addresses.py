import httpx
from fastapi import APIRouter, HTTPException, Query

from app.clients.http import ApiError
from app.services.address import addresses_reverse, addresses_search

router = APIRouter(tags=["addresses"])


@router.get("/addresses/search")
async def search_addresses_endpoint(
    sok: str | None = Query(None, description="Free-text search"),
    fuzzy: bool | None = Query(None),
    sokemodus: str | None = Query(None),
    adressenavn: str | None = Query(None),
    kommunenummer: str | None = Query(None),
    kommunenavn: str | None = Query(None),
    gardsnummer: int | None = Query(None),
    bruksnummer: int | None = Query(None),
    postnummer: str | None = Query(None),
    poststed: str | None = Query(None),
    utkoordsys: int | None = Query(None),
    treff_per_side: int | None = Query(None, alias="treffPerSide"),
    side: int | None = Query(None),
) -> dict:
    """Free-text address search via Geonorge /sok."""
    try:
        return await addresses_search(
            sok=sok,
            fuzzy=fuzzy,
            sokemodus=sokemodus,
            adressenavn=adressenavn,
            kommunenummer=kommunenummer,
            kommunenavn=kommunenavn,
            gardsnummer=gardsnummer,
            bruksnummer=bruksnummer,
            postnummer=postnummer,
            poststed=poststed,
            utkoordsys=utkoordsys,
            treff_per_side=treff_per_side,
            side=side,
        )
    except (ApiError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/addresses/reverse")
async def reverse_geocode(
    lat: float = Query(..., description="Latitude (WGS84)"),
    lon: float = Query(..., description="Longitude (WGS84)"),
    radius: float = Query(200, description="Search radius in metres"),
    koordsys: int | None = Query(None),
    utkoordsys: int | None = Query(None),
    treff_per_side: int | None = Query(None, alias="treffPerSide"),
    side: int | None = Query(None),
) -> dict:
    """Reverse geocode — find address near a coordinate via Geonorge /punktsok."""
    try:
        return await addresses_reverse(
            lat=lat,
            lon=lon,
            radius=radius,
            koordsys=koordsys,
            utkoordsys=utkoordsys,
            treff_per_side=treff_per_side,
            side=side,
        )
    except (ApiError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
