import httpx
from fastapi import APIRouter, HTTPException, Query

from app.clients.http import ApiError
from app.services.property import geokoding, properties_by_point, property_areas_by_point

router = APIRouter(tags=["properties"])


@router.get("/properties/search")
async def search_properties(
    ost: float | None = Query(None, description="Longitude / East (WGS84)"),
    nord: float | None = Query(None, description="Latitude / North (WGS84)"),
    koordsys: int = Query(4258, description="Input CRS SRID"),
    radius: int | None = Query(None, description="Search radius in metres"),
    treff_per_side: int | None = Query(None, alias="treffPerSide"),
    side: int | None = Query(None),
    utkoordsys: int | None = Query(None),
    # Matrikkel lookup params
    matrikkelnummer: str | None = Query(None),
    kommunenummer: str | None = Query(None),
    gardsnummer: int | None = Query(None),
    bruksnummer: int | None = Query(None),
    festenummer: int | None = Query(None),
    seksjonsnummer: int | None = Query(None),
) -> dict:
    """Find properties near a point (by lat/lng) or by matrikkel number."""
    try:
        if matrikkelnummer or kommunenummer or gardsnummer:
            return await geokoding(
                matrikkelnummer=matrikkelnummer,
                kommunenummer=kommunenummer,
                gardsnummer=gardsnummer,
                bruksnummer=bruksnummer,
                festenummer=festenummer,
                seksjonsnummer=seksjonsnummer,
                utkoordsys=utkoordsys,
            )
        if ost is None or nord is None:
            raise HTTPException(
                status_code=422,
                detail="ost and nord are required for point-based property search",
            )
        return await properties_by_point(
            ost=ost,
            nord=nord,
            koordsys=koordsys,
            radius=radius,
            treff_per_side=treff_per_side,
            side=side,
            utkoordsys=utkoordsys,
        )
    except HTTPException:
        raise  # re-raise 422 guard — don't convert to 502
    except (ApiError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/properties/areas")
async def get_property_areas(
    ost: float = Query(..., description="Longitude / East (WGS84)"),
    nord: float = Query(..., description="Latitude / North (WGS84)"),
    koordsys: int = Query(4258),
    radius: int | None = Query(None),
    maks_treff: int | None = Query(None, alias="maksTreff"),
    utkoordsys: int | None = Query(None),
) -> dict:
    """Fetch GeoJSON property area polygons near a point."""
    try:
        return await property_areas_by_point(
            ost=ost,
            nord=nord,
            koordsys=koordsys,
            radius=radius,
            maks_treff=maks_treff,
            utkoordsys=utkoordsys,
        )
    except (ApiError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/properties/geokoding")
async def get_geokoding_endpoint(
    matrikkelnummer: str | None = Query(None),
    kommunenummer: str | None = Query(None),
    gardsnummer: int | None = Query(None),
    bruksnummer: int | None = Query(None),
    festenummer: int | None = Query(None),
    seksjonsnummer: int | None = Query(None),
    omrade: bool | None = Query(None),
    utkoordsys: int | None = Query(None),
) -> dict:
    """Kartverket /geokoding — find property by matrikkel, optionally with area polygon."""
    try:
        return await geokoding(
            matrikkelnummer=matrikkelnummer,
            kommunenummer=kommunenummer,
            gardsnummer=gardsnummer,
            bruksnummer=bruksnummer,
            festenummer=festenummer,
            seksjonsnummer=seksjonsnummer,
            omrade=omrade,
            utkoordsys=utkoordsys,
        )
    except (ApiError, httpx.TimeoutException) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
